"""
Two-phase transfer learning for NutriSense AI.

Phase 1 — Feature extraction (5 epochs, frozen backbone, LR=1e-3)
Phase 2 — Fine-tuning (≤15 epochs, last 20 layers unfrozen, LR=1e-4, early stopping)

Usage:
    python train.py \
        --dataset_dir  /kaggle/input/nutrisense-unified \
        --class_index  /kaggle/working/class_index.json \
        --output_dir   /kaggle/working/checkpoints
"""

import argparse
import json
import os
import time

import torch
import torch.nn as nn
from torch.optim import Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau

from dataset import build_dataloaders
from model import build_model, count_trainable, freeze_backbone, unfreeze_last_n


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = correct = total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        out = model(images)
        loss = criterion(out, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)
        correct += (out.argmax(1) == labels).sum().item()
        total += images.size(0)
    return total_loss / total, correct / total


@torch.no_grad()
def eval_one_epoch(model, loader, criterion, device):
    model.eval()
    total_loss = correct = total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        out = model(images)
        loss = criterion(out, labels)
        total_loss += loss.item() * images.size(0)
        correct += (out.argmax(1) == labels).sum().item()
        total += images.size(0)
    return total_loss / total, correct / total


def save_checkpoint(model, epoch, val_acc, class_index, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, f"nutrisense_{val_acc:.4f}_ep{epoch}.pth")
    torch.save({
        "state_dict": model.state_dict(),
        "epoch": epoch,
        "val_acc": val_acc,
        "class_index": class_index,
    }, path)
    return path


def run_phase(model, train_loader, val_loader, criterion, optimizer, scheduler,
              device, n_epochs, patience, class_index, output_dir, tag):
    best_val_acc = 0.0
    best_path = None
    no_improve = 0

    for epoch in range(1, n_epochs + 1):
        t0 = time.time()
        tr_loss, tr_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        va_loss, va_acc = eval_one_epoch(model, val_loader, criterion, device)
        scheduler.step(va_loss)

        elapsed = time.time() - t0
        print(f"[{tag}] ep {epoch}/{n_epochs}  "
              f"train {tr_loss:.4f}/{tr_acc:.4f}  "
              f"val {va_loss:.4f}/{va_acc:.4f}  "
              f"({elapsed:.0f}s)")

        if va_acc > best_val_acc:
            best_val_acc = va_acc
            best_path = save_checkpoint(model, epoch, va_acc, class_index, output_dir)
            print(f"  ✓ Saved: {best_path}")
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= patience:
                print(f"  Early stopping after {epoch} epochs (patience={patience})")
                break

    return best_path, best_val_acc


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset_dir",    required=True)
    parser.add_argument("--class_index",    required=True)
    parser.add_argument("--output_dir",     default="./checkpoints")
    parser.add_argument("--batch_size",     type=int, default=32)
    parser.add_argument("--phase1_epochs",  type=int, default=5)
    parser.add_argument("--phase2_epochs",  type=int, default=15)
    parser.add_argument("--patience",       type=int, default=3)
    parser.add_argument("--num_workers",    type=int, default=2)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    with open(args.class_index, encoding="utf-8") as f:
        class_index = json.load(f)

    train_loader, val_loader, class_weights, num_classes = build_dataloaders(
        args.dataset_dir, args.class_index,
        batch_size=args.batch_size, num_workers=args.num_workers,
    )

    model = build_model(num_classes).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))

    # ── Phase 1 ──────────────────────────────────────────────────────────
    print(f"\n── Phase 1: frozen backbone ──")
    freeze_backbone(model)
    print(f"   Trainable params: {count_trainable(model):,}")
    opt = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3)
    sch = ReduceLROnPlateau(opt, patience=2, factor=0.5)
    best_path, best_acc = run_phase(
        model, train_loader, val_loader, criterion, opt, sch,
        device, args.phase1_epochs, args.patience,
        class_index, args.output_dir, "Phase1",
    )

    # ── Phase 2 ──────────────────────────────────────────────────────────
    print(f"\n── Phase 2: last 20 layers unfrozen ──")
    unfreeze_last_n(model, n=20)
    print(f"   Trainable params: {count_trainable(model):,}")
    opt = Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4)
    sch = ReduceLROnPlateau(opt, patience=2, factor=0.5)
    best_path, best_acc = run_phase(
        model, train_loader, val_loader, criterion, opt, sch,
        device, args.phase2_epochs, args.patience,
        class_index, args.output_dir, "Phase2",
    )

    print(f"\nTraining complete. Best val_acc={best_acc:.4f}")
    print(f"Best checkpoint: {best_path}")


if __name__ == "__main__":
    main()
