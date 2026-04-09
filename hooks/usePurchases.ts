import { useState, useEffect, useCallback } from 'react'
import {
  initPurchases,
  getCustomerInfo,
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPro,
} from '../utils/purchases'
import type { PurchasesPackage } from 'react-native-purchases'

export function usePurchases() {
  const [isProUser, setIsProUser] = useState(false)
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        await initPurchases()
        const [info, pkgs] = await Promise.all([
          getCustomerInfo(),
          getOfferings(),
        ])
        setIsProUser(isPro(info))
        setPackages(pkgs)
      } catch {
        // RevenueCat 미설정 시 무시
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setLoading(true)
    try {
      const result = await purchasePackage(pkg)
      setIsProUser(result)
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  const restore = useCallback(async () => {
    setLoading(true)
    try {
      const result = await restorePurchases()
      setIsProUser(result)
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  return { isProUser, packages, loading, purchase, restore }
}
