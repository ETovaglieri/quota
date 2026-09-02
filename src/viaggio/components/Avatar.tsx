function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/)
  return parti
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Avatar({
  nome,
  io = false,
  dimensione = 26,
  onClick,
  titolo,
}: {
  nome: string
  io?: boolean
  dimensione?: number
  onClick?: () => void
  titolo?: string
}) {
  const Componente = onClick ? 'button' : 'span'
  return (
    <Componente
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={titolo}
      data-io={io ? 'true' : undefined}
      className="q-avatar"
      style={{ width: dimensione, height: dimensione, cursor: onClick ? 'pointer' : undefined }}
    >
      {iniziali(nome)}
    </Componente>
  )
}
