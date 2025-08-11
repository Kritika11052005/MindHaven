import React from 'react'
import Link from "next/link";
import { Github, Linkedin, Mail, User } from "lucide-react";

function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container flex flex-col items-center gap-6 px-4 md:px-6">
        {/* Developer Info */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Created by <span className="font-medium text-foreground">Kritika Benjwal</span></span>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-6">
            <Link 
              href="https://github.com/Kritika11052005" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <Github className="h-4 w-4" />
              
            </Link>
            
            <Link 
              href="https://www.linkedin.com/in/kritika-benjwal/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <Linkedin className="h-4 w-4" />
              
            </Link>
            
            <Link 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=ananya.benjwal@gmail.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              <Mail className="h-4 w-4" />
              
            </Link>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
           Connect With Me
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer