export default function StatCard({ etichetta, valore, nota }: { etichetta: string; valore: string; nota?: string }) {
  return (
    <div className="p-3">
      <p className="q-micro">{etichetta}</p>
      <p className="mt-1 text-lg font-extrabold">{valore}</p>
      {nota && <p className="q-muted mt-0.5 text-[10px]">{nota}</p>}
    </div>
  )
}
