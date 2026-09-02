export default function Segmented<T extends string>({
  opzioni,
  valore,
  onChange,
}: {
  opzioni: { valore: T; etichetta: string }[]
  valore: T
  onChange: (v: T) => void
}) {
  return (
    <div className="q-seg">
      {opzioni.map((o) => (
        <button
          key={o.valore}
          type="button"
          className="q-seg-opt"
          data-attivo={valore === o.valore ? 'true' : undefined}
          onClick={() => onChange(o.valore)}
        >
          {o.etichetta}
        </button>
      ))}
    </div>
  )
}
