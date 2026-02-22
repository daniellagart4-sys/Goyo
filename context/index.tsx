'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { monad } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

const queryClient = new QueryClient()

const metadata = {
  name: 'Goyo',
  description: 'Enviar dinero, sin complicarte.',
  url: 'https://goyo.app',
  icons: [],
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId!,
  networks: [monad],
  defaultNetwork: monad,
  metadata,
  features: {
    email: false,
    socials: ['google', 'apple'],
    emailShowWallets: false,
    analytics: true,
  },
  allWallets: 'SHOW',
})

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
