import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-button hover:shadow-glow hover:scale-105",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        cinema: 
          "bg-gradient-to-r from-[hsl(357,91%,47%)] to-[hsl(0,100%,62%)] text-white font-bold shadow-[0_8px_32px_hsl(357,91%,47%,0.4)] hover:shadow-[0_0_60px_hsl(357,91%,47%,0.3)] hover:scale-105 active:scale-100",
        "cinema-outline":
          "border-2 border-[hsl(357,91%,47%)] text-white bg-transparent hover:bg-[hsl(357,91%,47%,0.2)] hover:shadow-[0_0_60px_hsl(357,91%,47%,0.3)]",
        whatsapp:
          "bg-[hsl(142,70%,45%)] text-white font-bold hover:brightness-110 shadow-lg",
        premium:
          "bg-gradient-to-r from-[hsl(45,93%,58%)] via-yellow-500 to-[hsl(45,93%,58%)] text-black font-bold hover:shadow-[0_0_30px_hsl(45,93%,58%,0.5)]",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
