import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {currentYear} LeadGen OS. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/terms"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link
            href="/privacy"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link
            href="/user-manual"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            User Manual
          </Link>
        </div>
      </div>
    </footer>
  )
}
