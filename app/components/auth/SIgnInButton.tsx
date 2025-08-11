"use client"
import { Button } from '../ui/button'
import Link from 'next/link'

import React from 'react'
interface SignInButtonProps{
    className?:string;

}
function SignInButton({className}:SignInButtonProps) {
  return (
    <Button asChild className={className}>
        <Link href="/login">Sign In</Link>
    </Button>
  )
}

export default SignInButton
