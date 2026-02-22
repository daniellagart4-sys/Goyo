'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useBalance, useAccount, useDisconnect } from 'wagmi'
import { parseEther } from 'viem'
import { useConversation } from '@elevenlabs/react'

type Screen = 'ob' | 'home' | 'addco' | 'voice' | 'conf' | 'act' | 'prof' | 'succ' | 'recv'

type Contact = { id: string; alias: string; wallet_address: string; network: string }
type Profile  = { wallet_address: string; display_name: string | null; email: string | null }

const CHIP_COLORS = ['#E02020','#E040FB','#5C3EE8','#2B5CE6','#00C073','#FFB800']
const chipColor   = (i: number) => CHIP_COLORS[i % CHIP_COLORS.length]
const initials    = (alias: string) =>
  alias.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
const netKey      = (ui: string) =>
  ui === 'Monad' ? 'monad' : ui === 'Ethereum' ? 'ethereum' : 'solana'
const netLabel    = (key: string) =>
  key === 'monad' ? 'Monad' : key === 'ethereum' ? 'Ethereum' : 'Solana'

const OB_STEPS = [
  {
    txt: '¡Hola! Soy Goyo 🌋 Voy a hacer que enviar dinero sea tan fácil como hablar.',
    h: 'Enviar dinero,<br/><em>sin complicarte.</em>',
    p: 'Solo habla. Yo entiendo. Sin wallets ni tecniciamos — solo tú y tu voz.',
    btn: 'Empezar',
  },
  {
    txt: 'Una vez que agregas a alguien, yo recuerdo todo lo demás 😊',
    h: 'Tus personas,<br/><em>de por vida.</em>',
    p: 'Agrega a alguien una sola vez. Después solo dices su nombre.',
    btn: 'Siguiente',
  },
  {
    txt: 'Te digo cuánto, a quién y cuándo. Tú confirmas. Simple ✅',
    h: 'Tú mandas,<br/><em>Goyo ejecuta.</em>',
    p: 'Face ID. Sin errores. Sin copiar wallets largas nunca más.',
    btn: '¡Empezar ya!',
  },
]

const ELEVENLABS_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? ''

/* ── SVG helpers ── */

const GoyoFaceMd = () => (
  <svg width="90" height="66" viewBox="0 0 90 66" fill="none">
    <circle cx="27" cy="26" r="8.5" fill="white" opacity=".96"/>
    <circle cx="63" cy="26" r="8.5" fill="white" opacity=".96"/>
    <circle cx="29.5" cy="23.5" r="3.5" fill="rgba(30,10,50,.85)"/>
    <circle cx="65.5" cy="23.5" r="3.5" fill="rgba(30,10,50,.85)"/>
    <circle cx="31" cy="21.5" r="1.4" fill="white"/>
    <circle cx="67" cy="21.5" r="1.4" fill="white"/>
    <path d="M22 44Q45 62 68 44" stroke="white" strokeWidth="3.8" strokeLinecap="round" fill="none" opacity=".9"/>
    <ellipse cx="12" cy="36" rx="9" ry="5.5" fill="rgba(255,255,255,.16)"/>
    <ellipse cx="78" cy="36" rx="9" ry="5.5" fill="rgba(255,255,255,.16)"/>
    <rect x="35" y="0" width="20" height="7" rx="3.5" fill="rgba(255,255,255,.2)"/>
    <rect x="38" y="1" width="14" height="5" rx="2.5" fill="rgba(255,200,0,.65)"/>
  </svg>
)

const GoyoFaceSm = () => (
  <svg width="26" height="20" viewBox="0 0 60 44" fill="none">
    <circle cx="18" cy="18" r="6" fill="white" opacity=".92"/>
    <circle cx="42" cy="18" r="6" fill="white" opacity=".92"/>
    <circle cx="20" cy="16" r="2.5" fill="rgba(30,10,50,.8)"/>
    <circle cx="44" cy="16" r="2.5" fill="rgba(30,10,50,.8)"/>
    <path d="M12 32Q30 44 48 32" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".88"/>
  </svg>
)

const GoyoFaceLg = () => (
  <svg width="100" height="76" viewBox="0 0 100 76" fill="none">
    <circle cx="30" cy="30" r="10.5" fill="white" opacity=".96"/>
    <circle cx="70" cy="30" r="10.5" fill="white" opacity=".96"/>
    <circle cx="33.5" cy="27" r="4.5" fill="rgba(30,10,50,.85)"/>
    <circle cx="73.5" cy="27" r="4.5" fill="rgba(30,10,50,.85)"/>
    <circle cx="35.5" cy="24.5" r="1.8" fill="white"/>
    <circle cx="75.5" cy="24.5" r="1.8" fill="white"/>
    <ellipse cx="14" cy="44" rx="11" ry="7" fill="rgba(255,255,255,.18)"/>
    <ellipse cx="86" cy="44" rx="11" ry="7" fill="rgba(255,255,255,.18)"/>
    <path d="M18 58Q50 78 82 58" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity=".9"/>
    <rect x="37" y="0" width="26" height="9" rx="4.5" fill="rgba(255,255,255,.2)"/>
    <rect x="41" y="1" width="18" height="7" rx="3.5" fill="rgba(255,200,0,.68)"/>
  </svg>
)

const GoyoFaceSucc = () => (
  <svg width="104" height="82" viewBox="0 0 104 82" fill="none">
    <path d="M18 14Q28 7 38 14" stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity=".75"/>
    <path d="M66 14Q76 7 86 14" stroke="white" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity=".75"/>
    <circle cx="30" cy="30" r="11" fill="white" opacity=".96"/>
    <circle cx="74" cy="30" r="11" fill="white" opacity=".96"/>
    <circle cx="33.5" cy="27" r="4.5" fill="rgba(30,10,50,.85)"/>
    <circle cx="77.5" cy="27" r="4.5" fill="rgba(30,10,50,.85)"/>
    <circle cx="36" cy="24.5" r="1.8" fill="white"/>
    <circle cx="80" cy="24.5" r="1.8" fill="white"/>
    <path d="M15 56Q52 82 89 56" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".92"/>
    <ellipse cx="13" cy="44" rx="11" ry="8" fill="rgba(255,255,255,.22)"/>
    <ellipse cx="91" cy="44" rx="11" ry="8" fill="rgba(255,255,255,.22)"/>
    <circle cx="30" cy="5" r="4" fill="rgba(255,200,0,.82)"/>
    <circle cx="74" cy="5" r="4" fill="rgba(224,64,251,.82)"/>
    <circle cx="52" cy="0" r="3" fill="rgba(43,92,230,.9)"/>
    <rect x="38" y="0" width="28" height="10" rx="5" fill="rgba(255,255,255,.18)"/>
    <rect x="42" y="1" width="20" height="8" rx="4" fill="rgba(255,200,0,.72)"/>
  </svg>
)

const BackIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M11 3.5L6.5 8.5L11 13.5" stroke="rgba(10,10,10,.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)


/* ── Main component ── */
export default function GoyoApp() {
  const [screen, setScreen] = useState<Screen>('ob')
  const [step, setStep]     = useState(0)
  const [obData, setObData] = useState(OB_STEPS[0])
  const [voiceTranscript, setVoiceTranscript]   = useState('')
  const [voiceLabel, setVoiceLabel]             = useState('Escuchando…')
  const [transferStatus, setTransferStatus]     = useState('')
  const [contactFound, setContactFound]         = useState(false)
  const [contactAddress, setContactAddress]     = useState('')
  const [succAlias, setSuccAlias]               = useState('')
  const [succAmount, setSuccAmount]             = useState('')
  const [succHash, setSuccHash]                 = useState('')
  const [selectedNet, setSelectedNet] = useState('Monad')
  const [faceScale, setFaceScale] = useState(1)

  const [mounted, setMounted]               = useState(false)
  const [copied, setCopied]                 = useState(false)

  // Datos de Supabase
  const [contacts, setContacts]             = useState<Contact[]>([])
  const [profile, setProfile]               = useState<Profile | null>(null)

  // Formulario contacto (add/edit)
  const [formAlias, setFormAlias]           = useState('')
  const [formWallet, setFormWallet]         = useState('')
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [savingContact, setSavingContact]   = useState(false)

  // Edición de perfil
  const [editProf, setEditProf]             = useState(false)
  const [profName, setProfName]             = useState('')
  const [profEmail, setProfEmail]           = useState('')
  const [savingProfile, setSavingProfile]   = useState(false)

  const { open } = useAppKit()
  const { isConnected, address } = useAppKitAccount()
  const { connector } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => { setMounted(true) }, [])

  const copyAddress = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ── Supabase helpers ── */
  const fetchProfile = async (addr: string) => {
    const res  = await fetch(`/api/profile?wallet=${addr}`)
    const data = await res.json()
    setProfile(data.profile)
    if (data.profile) {
      setProfName(data.profile.display_name ?? '')
      setProfEmail(data.profile.email ?? '')
    }
  }

  const fetchContacts = async (addr: string) => {
    const res  = await fetch(`/api/contacts?wallet=${addr}`)
    const data = await res.json()
    setContacts(data.contacts ?? [])
  }

  const openAddContact = () => {
    setEditingContact(null)
    setFormAlias('')
    setFormWallet('')
    setSelectedNet('Monad')
    nav('addco')
  }

  const openEditContact = (c: Contact) => {
    setEditingContact(c)
    setFormAlias(c.alias)
    setFormWallet(c.wallet_address)
    setSelectedNet(netLabel(c.network))
    nav('addco')
  }

  const saveContact = async () => {
    if (!address || !formAlias.trim() || !formWallet.trim()) return
    setSavingContact(true)
    if (editingContact) {
      await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_wallet: address, alias: formAlias, wallet_address: formWallet, network: netKey(selectedNet) }),
      })
    } else {
      await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_wallet: address, alias: formAlias, wallet_address: formWallet, network: netKey(selectedNet) }),
      })
    }
    await fetchContacts(address)
    setSavingContact(false)
    setEditingContact(null)
    setFormAlias('')
    setFormWallet('')
    nav('home')
  }

  const deleteContact = async (id: string) => {
    if (!address) return
    await fetch(`/api/contacts/${id}?wallet=${address}`, { method: 'DELETE' })
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  const saveProfile = async () => {
    if (!address) return
    setSavingProfile(true)
    const res  = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: address, display_name: profName, email: profEmail }),
    })
    const data = await res.json()
    setProfile(data.profile)
    setSavingProfile(false)
    setEditProf(false)
  }

  /* ── ElevenLabs voice agent ── */
  const executeTransfer = useCallback(async (toAddress: string, amount: string, alias: string) => {
    try {
      if (!isConnected || !address || !connector) {
        setTransferStatus('error_wallet_not_connected')
        return
      }
      const parsed = Number(amount)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setTransferStatus('error_invalid_amount')
        return
      }
      setTransferStatus('pending')

      // Use raw EIP-1193 provider to bypass wagmi's getChainId (which gets CAIP-2 string from Reown AppKit)
      const provider = await connector.getProvider() as { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
      const valueHex = '0x' + parseEther(amount.toString()).toString(16)
      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: toAddress, value: valueHex }],
      }) as string

      console.log('[Goyo] Transferencia completada:', hash)
      setSuccAlias(alias)
      setSuccAmount(amount)
      setSuccHash(hash)
      setTransferStatus('success_' + hash)
      setScreen('succ')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown'
      console.error('[Goyo] Transferencia fallida:', err)
      setTransferStatus('error_' + msg)
    }
  }, [address, isConnected, connector])

  const conversation = useConversation({
    onConnect:    () => setVoiceLabel('Escuchando…'),
    onDisconnect: () => { setVoiceLabel('Escuchando…'); setVoiceTranscript('') },
    onMessage:    (msg) => {
      setVoiceTranscript(msg.message)
      setVoiceLabel(msg.source === 'ai' ? 'Goyo dice…' : 'Escuchando…')
    },
    onError: (err) => console.error('[Goyo] ElevenLabs error:', err),
  })

  const startVoiceSession = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setVoiceTranscript('')
      setVoiceLabel('Escuchando…')
      setTransferStatus('')
      setContactFound(false)
      setContactAddress('')

      await conversation.startSession({
        agentId: ELEVENLABS_AGENT_ID,
        connectionType: 'webrtc',
        clientTools: {
          actionHandler: async ({ action, contact, token, amount }: {
            action: string; contact: string; token: string; token2?: string; amount: string
          }) => {
            console.log('[Goyo] actionHandler:', { action, contact, token, amount })

            if (contact) {
              const found = contacts.find(c =>
                c.alias.toLowerCase().includes(contact.toLowerCase())
              )
              if (found) {
                setContactFound(true)
                setContactAddress(found.wallet_address)
                if (action === 'transfer' && amount) {
                  await executeTransfer(found.wallet_address, amount, found.alias)
                }
              } else {
                setContactFound(false)
                setContactAddress('')
              }
            }
          },
        },
        dynamicVariables: {
          elevenlabs_Address:        address || '',
          elevenlabs_Status:         isConnected ? 'connected' : 'disconnected',
          elevenlabs_Wallet_Name:    'Reown',
          elevenlabs_check_contact:  contactFound,
          elevenlabs_transfer_status: transferStatus,
        },
      })
    } catch (err) {
      console.error('[Goyo] Error al iniciar conversación:', err)
    }
  }, [conversation, address, isConnected, contacts, contactFound, transferStatus, executeTransfer])

  const stopVoiceSession = useCallback(async () => {
    await conversation.endSession()
  }, [conversation])

  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: 143, // Monad Mainnet
    query: { enabled: !!address },
  })

  const screenRef = useRef<Screen>('ob')

  // keep ref in sync for voice callbacks
  useEffect(() => { screenRef.current = screen }, [screen])

  // Navegar a home al autenticarse
  useEffect(() => {
    if (isConnected && screen === 'ob') setScreen('home')
  }, [isConnected, screen])

  // Cargar perfil y contactos cuando se conecta la wallet
  useEffect(() => {
    if (address) {
      fetchProfile(address)
      fetchContacts(address)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  // Auto-start/stop voz con ElevenLabs
  useEffect(() => {
    if (screen === 'voice') {
      startVoiceSession()
    } else {
      if (conversation.status === 'connected') stopVoiceSession()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // Confetti on success
  useEffect(() => {
    if (screen !== 'succ') return
    const id = setTimeout(() => {
      const c = document.getElementById('cfl')
      if (!c) return
      c.innerHTML = ''
      const cols = ['#5C3EE8','#E040FB','#FFB800','#00C073','#3D5AF1','#E02020','#fff']
      for (let i = 0; i < 75; i++) {
        const p = document.createElement('div')
        p.className = 'cf'
        const sz = Math.random()*12+5
        p.style.cssText = `left:${Math.random()*100}%;background:${cols[i%cols.length]};width:${sz}px;height:${sz}px;border-radius:${Math.random()>.5?'50%':'3px'};animation-duration:${Math.random()*1.8+1.3}s;animation-delay:${Math.random()*.85}s`
        c.appendChild(p)
      }
      setTimeout(() => { if (c) c.innerHTML = '' }, 5500)
    }, 300)
    return () => clearTimeout(id)
  }, [screen])

  const nav = (id: Screen) => setScreen(id)

  const obNext = () => {
    if (step >= 2) { open(); return }
    const next = step + 1
    setStep(next)
    setObData(OB_STEPS[next])
    setFaceScale(0.85)
    setTimeout(() => setFaceScale(1), 50)
  }

  if (!mounted) return null

  const s = (id: Screen) => `scr${screen === id ? ' on' : ''}`

  /* ── Shared bottom navs ── */
  const NavHome = () => (
    <div className={`ni${screen==='home'?' on':''}`} onClick={() => nav('home')}>
      <svg viewBox="0 0 24 24" fill="none"><path d="M3 10L12 3L21 10V21H15V14H9V21H3V10Z" stroke={screen==='home'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span className="ni-lb">Inicio</span>
    </div>
  )
  const NavVoice = () => (
    <div className={`ni${screen==='voice'?' on':''}`} onClick={() => nav('voice')}>
      <svg viewBox="0 0 24 24" fill="none"><rect x="8" y="2" width="8" height="13" rx="4" stroke={screen==='voice'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2"/><path d="M4 11C4 16.5 7.6 21 12 21C16.4 21 20 16.5 20 11" stroke={screen==='voice'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2" strokeLinecap="round" fill="none"/><line x1="12" y1="21" x2="12" y2="23" stroke={screen==='voice'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2" strokeLinecap="round"/></svg>
      <span className="ni-lb">Enviar</span>
    </div>
  )
  const NavAct = () => (
    <div className={`ni${screen==='act'?' on':''}`} onClick={() => nav('act')}>
      <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="15" rx="2" stroke={screen==='act'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2"/><path d="M3 10H21" stroke={screen==='act'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2"/><line x1="8" y1="3" x2="8" y2="7" stroke={screen==='act'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="3" x2="16" y2="7" stroke={screen==='act'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2" strokeLinecap="round"/></svg>
      <span className="ni-lb">Actividad</span>
    </div>
  )
  const NavProf = () => (
    <div className={`ni${screen==='prof'?' on':''}`} onClick={() => nav('prof')}>
      <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4.5" stroke={screen==='prof'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2"/><path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={screen==='prof'?'#5C3EE8':'rgba(10,10,10,.3)'} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
      <span className="ni-lb">Perfil</span>
    </div>
  )

  return (
    <div className="app-root">

        {/* ════ ONBOARDING ════ */}
        <div className={s('ob')} id="ob">
          <div className="sb">
          </div>
          <div className="ob-outer">
            <div className="ob-bubble-row">
              <div className="ob-sender" />
              <div className="ob-bubble">{obData.txt}</div>
            </div>
            <div className="ob-hero">
              <div
                className="goyo-circle"
                style={{
                  transform: `scale(${faceScale})`,
                  transition: faceScale === 1 ? 'transform .28s cubic-bezier(.175,.885,.32,1.275)' : 'none',
                }}
              >
                <GoyoFaceMd />
              </div>
            </div>
            <div className="ob-copy">
              <h2 dangerouslySetInnerHTML={{ __html: obData.h }} />
              <p>{obData.p}</p>
            </div>
            <div>
              <div className="ob-prog">
                <div className={`ob-seg${step >= 0 ? ' on' : ''}`} />
                <div className={`ob-seg${step >= 1 ? ' on' : ''}`} />
                <div className={`ob-seg${step >= 2 ? ' on' : ''}`} />
              </div>
              <button className="btn-main H" onClick={obNext}>{obData.btn}</button>
              <button className="btn-skip" onClick={() => open()}>Ya tengo cuenta</button>
            </div>
          </div>
        </div>

        {/* ════ HOME ════ */}
        <div className={s('home')} id="home">
          <div className="sb">
          </div>
          <div className="sc" style={{ paddingBottom: '90px' }}>
            <div className="home-header">
              <div>
                <div className="home-greet">Buenos días 🌋</div>
                <div className="home-name H">{profile?.display_name || 'Mi cuenta'}</div>
              </div>
              <div className="avatar-btn" onClick={() => nav('prof')}>
                {profile?.display_name ? initials(profile.display_name) : '?'}
              </div>
            </div>

            <div className="bal">
              <div className="bal-lbl">SALDO DISPONIBLE</div>
              {balanceLoading ? (
                <div className="bal-amt H" style={{ opacity: 0.4, fontSize: '32px' }}>—</div>
              ) : balanceData ? (() => {
                const num = Number(balanceData.value) / 10 ** balanceData.decimals
                const [whole, dec] = num.toFixed(4).split('.')
                return (
                  <div className="bal-amt H">
                    {whole}<sup style={{ fontSize: '22px', fontFamily: 'var(--font-bricolage)' }}>.{dec}</sup>
                  </div>
                )
              })() : (
                <div className="bal-amt H" style={{ opacity: 0.35, fontSize: '32px' }}>0.0000</div>
              )}
              <div className="bal-sub">SALDO {balanceData?.symbol ?? 'MON'} · MONAD</div>
              <div className="bal-actions">
                <button className="bal-btn H" onClick={() => nav('addco')}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3.5" stroke="rgba(255,255,255,.7)" strokeWidth="1.5"/><path d="M2 14C2 11 4.7 8.5 8 8.5C11.3 8.5 14 11 14 14" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                  Contactos
                </button>
                <button className="bal-btn H" onClick={() => nav('recv')}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="rgba(255,255,255,.7)" strokeWidth="1.5"/><line x1="8" y1="5" x2="8" y2="11" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="8" x2="11" y2="8" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Recibir
                </button>
                <button className="bal-btn highlight H" onClick={() => nav('voice')}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8L14 8M10 4L14 8L10 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Enviar
                </button>
              </div>
            </div>

            <div className="goyo-strip" onClick={() => nav('voice')}>
              <div className="gs-face"><GoyoFaceSm /></div>
              <div className="gs-text">Di <strong>&quot;Envía $0 a Ana&quot;</strong> y te ayudo en segundos</div>
              <button className="hablar-btn" onClick={(e) => { e.stopPropagation(); nav('voice') }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="4" y="1" width="6" height="8" rx="3" fill="white"/><path d="M2 7C2 10.3 4.2 13 7 13C9.8 13 12 10.3 12 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
                Hablar
              </button>
            </div>

            <div className="sh">
              <div className="sh-t H">Frecuentes</div>
              <div className="sh-l" onClick={openAddContact}>+ Agregar</div>
            </div>
            <div className="chips-row">
              {contacts.slice(0, 4).map((c, i) => (
                <div key={c.id} className="chip" onClick={() => openEditContact(c)}>
                  <div className="chip-av" style={{ background: chipColor(i) }}>{initials(c.alias)}</div>
                  <div className="chip-n">{c.alias.split(' ')[0]}</div>
                </div>
              ))}
              <div className="chip chip-add" onClick={openAddContact}>
                <div className="chip-av">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="9" y1="3" x2="9" y2="15" stroke="#C8C8C8" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="9" x2="15" y2="9" stroke="#C8C8C8" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <div className="chip-n">Nuevo</div>
              </div>
            </div>

            <div className="sh" style={{ marginTop: '6px' }}>
              <div className="sh-t H">Actividad</div>
              <div className="sh-l">Ver todo</div>
            </div>
            <div className="alist">
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(10,10,10,.3)', fontSize: '14px' }}>Sin actividad reciente</div>
            </div>
          </div>
          <div className="bnav"><NavHome /><NavVoice /><NavAct /><NavProf /></div>
        </div>

        {/* ════ ADD / EDIT CONTACT ════ */}
        <div className={s('addco')} id="addco">
          <div className="sb"><span className="sb-time">9:41</span></div>
          <div className="back-row">
            <button className="back-btn" onClick={() => { setEditingContact(null); nav('home') }}><BackIcon /></button>
            <div className="back-title H">{editingContact ? 'Editar contacto' : 'Nuevo contacto'}</div>
            {editingContact && (
              <button
                style={{ marginLeft: 'auto', marginRight: '20px', fontSize: '13px', color: '#E02020', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => { deleteContact(editingContact.id); setEditingContact(null); nav('home') }}
              >Eliminar</button>
            )}
          </div>
          <div className="sc" style={{ paddingBottom: '100px' }}>
            <div className="fwrap">
              <div className="info-card">
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--goyo-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GoyoFaceSm />
                </div>
                <div className="info-t">Una sola vez y <strong>nunca más</strong> copies wallets largas 🔒</div>
              </div>
              <label className="fl">Alias</label>
              <input
                className="fi"
                type="text"
                placeholder="Ej: Ana, Mamá, Jefe…"
                value={formAlias}
                onChange={e => setFormAlias(e.target.value)}
              />
              <label className="fl">Dirección wallet</label>
              <div className="fi-row">
                <input
                  className="fi"
                  type="text"
                  placeholder="0x..."
                  value={formWallet}
                  onChange={e => setFormWallet(e.target.value)}
                />
              </div>
              <label className="fl">Red</label>
              <div className="net-row">
                {['Monad', 'Ethereum', 'Solana'].map((net) => (
                  <button
                    key={net}
                    className={`net-chip${selectedNet === net ? ' sel' : ''}`}
                    onClick={() => setSelectedNet(net)}
                  >{net}</button>
                ))}
              </div>
              {formWallet && (
                <div className="verified-badge">
                  <span style={{ fontSize: '17px' }}>🛡️</span>
                  <div>
                    <div className="vb-t">{formAlias || 'Contacto'}</div>
                    <div className="vb-a">···{formWallet.slice(-6)} · {selectedNet}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="footer-fixed">
            <button
              className="btn-main H"
              onClick={saveContact}
              disabled={savingContact || !formAlias.trim() || !formWallet.trim()}
              style={{ maxWidth: '100%', opacity: savingContact || !formAlias.trim() || !formWallet.trim() ? 0.5 : 1 }}
            >
              {savingContact ? 'Guardando…' : editingContact ? 'Guardar cambios' : 'Guardar contacto'}
            </button>
          </div>
        </div>

        {/* ════ VOICE ════ */}
        <div className={s('voice')} id="voice">
          <div className="sb"><span className="sb-time">9:41</span></div>
          <div className="voice-body">
            <div className="voice-face-wrap">
              <div className="voice-glow" />
              <div className="voice-circle"><GoyoFaceLg /></div>
              <div className={`wavebars${conversation.isSpeaking ? ' speaking' : ''}`}>
                <div className="wb" /><div className="wb" /><div className="wb" /><div className="wb" /><div className="wb" />
              </div>
            </div>
            <div className="trans-card">
              <div className="trans-label">
                {conversation.status === 'connected'
                  ? voiceLabel
                  : conversation.status === 'connecting'
                    ? 'Conectando…'
                    : 'Iniciando…'}
              </div>
              <div className="trans-text H">
                <span style={{ color: conversation.isSpeaking ? '#E040FB' : 'var(--vio)' }}>
                  {voiceTranscript}
                </span>
              </div>
              {transferStatus.startsWith('pending') && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--vio)', opacity: 0.8 }}>
                  Confirmando transacción…
                </div>
              )}
              {transferStatus.startsWith('error') && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: '#E02020' }}>
                  Error: {transferStatus.replace('error_', '')}
                </div>
              )}
            </div>
            <button className="cancel-btn" onClick={async () => { await stopVoiceSession(); nav('home') }}>
              Cancelar
            </button>
          </div>
        </div>

        {/* ════ CONFIRM ════ */}
        <div className={s('conf')} id="conf">
          <div className="sb"><span className="sb-time">9:41</span></div>
          <div className="back-row">
            <button className="back-btn" onClick={() => nav('home')}><BackIcon /></button>
            <div className="back-title H">Confirmar envío</div>
          </div>
          <div className="conf-scroll">
            <div className="goyo-tip">
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--goyo-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <GoyoFaceSm />
              </div>
              <div className="gt-text">¿Confirmamos el envío?</div>
            </div>
            <div className="conf-card">
              <div className="cc-lbl">ENVIANDO A</div>
              <div className="cc-rec">
                <div className="cc-av">—</div>
                <div><div className="cc-name H">—</div><div className="cc-addr">Monad</div></div>
              </div>
              <div className="cc-div" />
              <div className="cc-amt-row">
                <div className="cc-amt H">$5.00</div>
                <div className="cc-curr H">USDC</div>
              </div>
              <div className="cc-net"><div className="cc-dot" />Monad · Fee ~$0.001</div>
              <div className="cc-pills">
                <div className="cc-pill H">✓ Verificado</div>
                <div className="cc-pill H">🔒 Face ID</div>
                <div className="cc-pill H">⚡ Monad</div>
              </div>
            </div>
          </div>
          <div className="footer-fixed">
            <button className="btn-main H" onClick={() => nav('succ')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="3" fill="rgba(255,255,255,.2)"/><path d="M5.5 9L7.5 11L12.5 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Confirmar con Face ID
            </button>
            <button className="btn-skip" onClick={() => nav('home')}>Cancelar</button>
          </div>
        </div>

        {/* ════ ACTIVITY ════ */}
        <div className={s('act')} id="act">
          <div className="sb"><span className="sb-time">9:41</span></div>
          <div className="page-title H">Actividad</div>
          <div className="sc" style={{ paddingBottom: '90px' }}>
            <div className="alist">
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(10,10,10,.3)', fontSize: '14px' }}>Sin actividad reciente</div>
            </div>
          </div>
          <div className="bnav"><NavHome /><NavVoice /><NavAct /><NavProf /></div>
        </div>

        {/* ════ PROFILE ════ */}
        <div className={s('prof')} id="prof">
          <div className="sb"><span className="sb-time">9:41</span></div>
          <div className="sc" style={{ paddingBottom: '90px', paddingTop: '10px' }}>
            <div className="prof-card">
              <div className="prof-av">🌋</div>
              {editProf ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    className="fi"
                    type="text"
                    placeholder="Nombre"
                    value={profName}
                    onChange={e => setProfName(e.target.value)}
                    style={{ fontSize: '14px', padding: '8px 12px' }}
                  />
                  <input
                    className="fi"
                    type="email"
                    placeholder="Email"
                    value={profEmail}
                    onChange={e => setProfEmail(e.target.value)}
                    style={{ fontSize: '14px', padding: '8px 12px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <button
                      className="btn-main H"
                      onClick={saveProfile}
                      disabled={savingProfile}
                      style={{ flex: 1, fontSize: '13px', padding: '10px', opacity: savingProfile ? 0.6 : 1 }}
                    >{savingProfile ? 'Guardando…' : 'Guardar'}</button>
                    <button
                      className="btn-skip"
                      onClick={() => { setEditProf(false); setProfName(profile?.display_name ?? ''); setProfEmail(profile?.email ?? '') }}
                      style={{ flex: 1, fontSize: '13px' }}
                    >Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <div className="prof-name H">{profile?.display_name || 'Sin nombre'}</div>
                  <div className="prof-email">{profile?.email || '—'}</div>
                  {address && (
                    <div
                      className="prof-email"
                      style={{ marginTop: '2px', fontSize: '11px', opacity: 0.55, letterSpacing: '0.01em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={copyAddress}
                    >
                      {address.slice(0, 6)}···{address.slice(-4)}
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/></svg>
                    </div>
                  )}
                  <button
                    style={{ marginTop: '8px', fontSize: '12px', color: 'var(--vio)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    onClick={() => setEditProf(true)}
                  >✏️ Editar perfil</button>
                </div>
              )}
            </div>
            <div className="plist">
              <div className="prow" onClick={() => open({ view: 'Account' })}><div className="prow-l"><div className="prow-ic" style={{ background: 'var(--vio-light)' }}>🔑</div><div><div className="prow-t">Seguridad</div><div className="prow-s">Face ID activado</div></div></div><div className="parr">›</div></div>
              <div className="prow" onClick={openAddContact}><div className="prow-l"><div className="prow-ic" style={{ background: 'rgba(224,64,251,.08)' }}>👤</div><div><div className="prow-t">Contactos</div><div className="prow-s">{contacts.length} guardados</div></div></div><div className="parr">›</div></div>
              <div className="prow"><div className="prow-l"><div className="prow-ic" style={{ background: 'rgba(43,92,230,.08)' }}>🔔</div><div><div className="prow-t">Notificaciones</div></div></div><div className="parr">›</div></div>
              <div className="prow" onClick={() => open({ view: 'Networks' })}><div className="prow-l"><div className="prow-ic" style={{ background: 'rgba(0,192,115,.08)' }}>🌐</div><div><div className="prow-t">Red</div><div className="prow-s">Monad (default)</div></div></div><div className="parr">›</div></div>
              <div className="prow" onClick={() => { disconnect(); setScreen('ob') }} style={{ marginTop: '8px' }}>
                <div className="prow-l">
                  <div className="prow-ic" style={{ background: 'rgba(224,32,32,.08)' }}>🚪</div>
                  <div><div className="prow-t" style={{ color: '#E02020' }}>Cerrar sesión</div></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bnav"><NavHome /><NavVoice /><NavAct /><NavProf /></div>
        </div>

        {/* ════ RECIBIR ════ */}
        <div className={s('recv')} id="recv">
          <div className="sb"><span className="sb-time">9:41</span></div>
          <div className="back-row">
            <button className="back-btn" onClick={() => nav('home')}><BackIcon /></button>
            <div className="back-title H">Recibir</div>
          </div>
          <div className="sc" style={{ paddingBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', paddingTop: '32px' }}>

            <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'var(--goyo-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 48px rgba(92,62,232,.28)' }}>
              <GoyoFaceMd />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: 'rgba(10,10,10,.4)', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '6px' }}>TU DIRECCIÓN MON · MONAD</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'rgba(10,10,10,.75)', wordBreak: 'break-all', lineHeight: 1.6, padding: '0 8px' }}>
                {address ?? '—'}
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn-main H"
                onClick={copyAddress}
                style={{ maxWidth: '100%', background: copied ? 'linear-gradient(135deg,#00C073,#00a860)' : undefined, transition: 'background .3s' }}
              >
                {copied ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9.5L7.5 13L14 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="6" y="6" width="10" height="10" rx="2" stroke="white" strokeWidth="1.6"/><path d="M12 6V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke="white" strokeWidth="1.6"/></svg>
                    Copiar dirección
                  </>
                )}
              </button>
              <button className="btn-skip" onClick={() => nav('home')}>Volver al inicio</button>
            </div>

          </div>
        </div>

        {/* ════ SUCCESS ════ */}
        <div className={s('succ')} id="succ">
          <div className="sb" style={{ paddingTop: '59px' }} />
          <div className="succ-body">
            <div className="succ-face">
              <div style={{ width: '160px', height: '160px', borderRadius: '50%', background: 'var(--goyo-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 22px 65px rgba(92,62,232,.38),0 8px 24px rgba(224,64,251,.22)' }}>
                <GoyoFaceSucc />
              </div>
            </div>
            <div>
              <div className="succ-title H">¡Listo! 🎉</div>
              <div className="succ-sub">{succAlias} recibe tu dinero en segundos.</div>
            </div>
            <div className="succ-card">
              <div className="sc-row"><span className="sc-k">Para</span><span className="sc-v H">{succAlias}</span></div>
              <div className="sc-row"><span className="sc-k">Monto</span><span className="sc-v green H">{succAmount} MON</span></div>
              <div className="sc-row"><span className="sc-k">Red</span><span className="sc-v H">Monad</span></div>
              <div className="sc-row"><span className="sc-k">Estado</span><span className="sc-v green H">✓ Enviado</span></div>
              {succHash && (
                <div className="sc-row">
                  <span className="sc-k">Hash</span>
                  <a
                    href={`https://monadvision.com/tx/${succHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sc-v"
                    style={{ fontSize: '11px', fontFamily: 'monospace', opacity: 0.7, wordBreak: 'break-all', color: 'var(--vio)', textDecoration: 'underline' }}
                  >
                    {succHash}
                  </a>
                </div>
              )}
            </div>
            <button className="btn-main H" onClick={() => nav('home')} style={{ maxWidth: '100%' }}>Volver al inicio</button>
          </div>
          <div className="cfl" id="cfl" />
        </div>

    </div>
  )
}
