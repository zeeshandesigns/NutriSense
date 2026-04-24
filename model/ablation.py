"""
Ablation study: trains EfficientNetB0, MobileNetV2, ResNet50 on identical
splits with identical hyperparameters to justify the architecture choice.

Usage:
    python ablation.py \
        --dataset_dir /kaggle/input/nutrisense-unified \
        --class_index /kaggle/working/class_index.json \
        --output_dir  /kaggle/working/evaluation \
        --epochs      8
"""

import argparse
import csv
import json
import os
import time

import torch
import torch.nn as nn
from torch.optim import Adam
from torchvision import models
from torchvision.models import (
    EfficientNet_B0_Weights, MobileNet_V2_Weights, ResNet50_Weights,
)

from dataset import build_dataloaders


def build_candidate(name: str, num_classes: int) -> nn.Module:
    if name == "EfficientNetB0":
        m = models.efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        m.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(m.classifier[1].in_features, num_classes),
        )
    elif name == "MobileNetV2":
        m = models.mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)
        m.classifier[1] = nn.Linear(m.classifier[1].in_features, num_classes)
    elif name == "ResNet50":
        m = models.resnet50(weights=ResNet50_Weights.IMAGENET1K_V1)
        m.fc = nn.Linear(m.fc.in_features, num_classes)
    else:
        raise ValueError(f"Unknown candidate: {name}")
    return m


@torch.no_grad()
def evaluate(model, loader, device):
    model.eval()
    correct1 = correct3 = total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        out = model(images)
        top3 = out.topk(3, dim=1).indices
        correct1 += (top3[:, 0] == labels).sum().item()
        correct3 += sum(labels[i] in top3[i] for i in range(len(labels)))
        total += len(labels)
    return correct1 / total, correct3 / total


def train_candidate(model, train_loader, val_loader, criterion, device, n_epochs):
    opt = Adam(model.parameters(), lr=1e-3)
    for epoch in range(1, n_epochs + 1):
        model.train()
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            opt.zero_grad()
            criterion(model(images), labels).backward()
            opt.step()
        top1, _ = evaluate(model, val_loader, device)
        print(f"  epoch {epoch}/{n_epochs}  val_top1={top1:.4f}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset_dir", required=True)
    parser.add_argument("--class_index", required=True)
    parser.add_argument("--output_dir",  default="./evaluation")
    parser.add_argument("--epochs",      type=int, default=8)
    parser.add_argument("--batch_size",  type=int, default=32)
    parser.add_argument("--num_workers", type=int, default=2)
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    with open(args.class_index, encoding="utf-8") as f:
        class_index = json.load(f)
    num_classes = len(class_index)

    train_loader, val_loader, class_weights, _ = build_dataloaders(
        args.dataset_dir, args.class_index,
        batch_size=args.batch_size, num_workers=args.num_workers,
    )
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))

    results = []
    for name in ["EfficientNetB0", "MobileNetV2", "ResNet50"]:
        print(f"\n── {name} ──")
        model = build_candidate(name, num_classes).to(device)
        params_m = round(sum(p.numel() for p in model.parameters()) / 1e6, 1)

        t0 = time.time()
        train_candidate(model, train_loader, val_loader, criterion, device, args.epochs)
        top1, top3 = evaluate(model, val_loader, device)
        elapsed = round((time.time() - t0) / 60, 1)

        results.append({
            "model": name,
            "params_M": params_m,
            "top1_acc": round(top1 * 100, 2),
            "top3_acc": round(top3 * 100, 2),
            "train_time_min": elapsed,
        })
        print(f"  top1={top1:.4f}  top3={top3:.4f}  params={params_m}M  time={elapsed}min")

    csv_path = os.path.join(args.output_dir, "ablation_results.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=results[0].keys())
        w.writeheader()
        w.writerows(results)

    print(f"\nAblation results → {csv_path}")
    winner = max(results, key=lambda r: r["top1_acc"])
    print(f"Winner: {winner['model']} — {winner['top1_acc']}% top-1")


if __name__ == "__main__":
    main()
