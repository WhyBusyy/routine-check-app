import { Platform } from 'react-native'
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases'

// RevenueCat API Key - 실제 키로 교체 필요
const API_KEY = Platform.select({
  ios: 'appl_YOUR_REVENUECAT_API_KEY',
  android: 'goog_YOUR_REVENUECAT_API_KEY',
}) ?? ''

const ENTITLEMENT_ID = 'pro'

let isConfigured = false

export async function initPurchases() {
  if (isConfigured) return

  Purchases.setLogLevel(LOG_LEVEL.DEBUG)
  Purchases.configure({ apiKey: API_KEY })
  isConfigured = true
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo()
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings()
  return offerings.current?.availablePackages ?? []
}

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch (e: any) {
    if (e.userCancelled) return false
    throw e
  }
}

export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases()
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
}

export function isPro(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
}
