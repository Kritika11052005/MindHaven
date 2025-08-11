"use client"
import { ThemeProvider } from 'next-themes'
import React from 'react'
import { SessionProvider as NextauthSessionProvider } from "next-auth/react"
import { SessionProvider as CustomSessionProvider } from '@/lib/context/sessionContext'
import RouteProtector from '@/components/RouteProtector'

function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextauthSessionProvider>
            <CustomSessionProvider>
                <RouteProtector>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme='system'
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                    </ThemeProvider>
                </RouteProtector>
            </CustomSessionProvider>
        </NextauthSessionProvider>
    )
}

export default Providers