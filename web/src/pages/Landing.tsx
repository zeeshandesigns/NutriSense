import { Link } from 'react-router-dom'

const STEPS = [
  { icon: '📸', title: 'Snap', desc: 'Point your camera at any South Asian dish' },
  { icon: '🧠', title: 'Identify', desc: 'EfficientNetB0 CNN classifies from 100 food classes' },
  { icon: '📋', title: 'Understand', desc: 'Get nutrition facts and a plain-language insight instantly' },
]

const ABLATION = [
  { model: 'EfficientNetB0 (ours)', params: '5.3M', top1: '~80%', top3: '~93%', highlight: true },
  { model: 'MobileNetV2',           params: '3.4M', top1: '~74%', top3: '~89%', highlight: false },
  { model: 'ResNet50',              params: '25.6M',top1: '~76%', top3: '~90%', highlight: false },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <span className="font-bold text-brand-700 text-xl tracking-tight">NutriSense AI</span>
        <Link to="/login" className="bg-brand-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-800 transition-colors">
          Get Started
        </Link>
      </nav>

      <section className="max-w-3xl mx-auto px-8 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Know your desi food — instantly
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          NutriSense AI recognises Pakistani and South Asian dishes from a single photo.
          No manual entry. No guessing. Point, snap, understand.
        </p>
        <Link to="/login" className="bg-brand-700 text-white px-8 py-3 rounded-lg text-base hover:bg-brand-800 transition-colors inline-block">
          Try It Free
        </Link>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-8">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.title} className="text-center">
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold mb-2">The Model</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Fine-tuned EfficientNetB0 trained on a curated dataset of ~100 food classes including ~35 South Asian dishes
          absent from standard benchmarks. Ablation study confirmed it outperforms lighter and heavier alternatives.
        </p>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-brand-50 text-left">
              <th className="p-2 border">Model</th>
              <th className="p-2 border">Params</th>
              <th className="p-2 border">Top-1</th>
              <th className="p-2 border">Top-3</th>
            </tr>
          </thead>
          <tbody>
            {ABLATION.map(r => (
              <tr key={r.model} className={r.highlight ? 'bg-brand-50 font-semibold' : ''}>
                <td className="p-2 border">{r.model}</td>
                <td className="p-2 border">{r.params}</td>
                <td className="p-2 border">{r.top1}</td>
                <td className="p-2 border">{r.top3}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-3">Approximate values from held-out validation set.</p>
      </section>

      <footer className="border-t py-8 text-center text-sm text-gray-400">
        NutriSense AI — Final Year Project &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
