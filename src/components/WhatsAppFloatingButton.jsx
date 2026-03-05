import { WhatsappLogo } from '@phosphor-icons/react'

const WhatsAppButton = () => {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER

  if (!number) return null

  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      style={s.button}
      aria-label="WhatsApp"
    >
      <WhatsappLogo size={26} weight="fill" />
    </a>
  )
}

const s = {
  button: {
    position: "fixed",
    right: "28px",
    bottom: "28px",

    width: "60px",
    height: "60px",
    borderRadius: "50%",

    background: "#25D366",
    color: "white",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",

    zIndex: 1000,
    transition: "transform 0.2s ease"
  }
}

export default WhatsAppButton