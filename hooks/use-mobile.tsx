"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const checkMobile = () => {
      // Проверяем и ширину экрана, и user agent для мобильных устройств
      const width = window.innerWidth
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isSmallScreen = width < 768

      // Считаем мобильным если либо маленький экран, либо мобильное устройство
      const mobile = isSmallScreen || isMobileDevice

      setIsMobile(mobile)
      console.log("Mobile check:", {
        width,
        userAgent: userAgent.substring(0, 50) + "...",
        isMobileDevice,
        isSmallScreen,
        finalResult: mobile,
      })
    }

    // Initial check
    checkMobile()

    // Add event listener for resize
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Return false during SSR to avoid hydration mismatch
  if (!mounted) {
    return false
  }

  return isMobile
}
