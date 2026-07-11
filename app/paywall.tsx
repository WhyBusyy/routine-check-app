import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { usePurchases } from '../hooks/usePurchases'
import { t } from '../i18n'

const FEATURES = [
  { emoji: '📊', titleKey: 'paywall.featureStatsTitle', descKey: 'paywall.featureStatsDesc' },
  { emoji: '🔔', titleKey: 'paywall.featureNotifTitle', descKey: 'paywall.featureNotifDesc' },
  { emoji: '🎨', titleKey: 'paywall.featureThemeTitle', descKey: 'paywall.featureThemeDesc' },
  { emoji: '♾️', titleKey: 'paywall.featureUnlimitedTitle', descKey: 'paywall.featureUnlimitedDesc' },
]

export default function PaywallScreen() {
  const router = useRouter()
  const { packages, loading, purchase, restore } = usePurchases()

  const handlePurchase = async () => {
    if (packages.length === 0) {
      Alert.alert(t('paywall.alertNoProducts'))
      return
    }
    try {
      const success = await purchase(packages[0])
      if (success) {
        Alert.alert(t('paywall.alertPurchaseSuccessTitle'), t('paywall.alertPurchaseSuccessMsg'), [
          { text: t('paywall.confirm'), onPress: () => router.back() },
        ])
      }
    } catch {
      Alert.alert(t('paywall.alertPurchaseFailTitle'), t('paywall.alertRetry'))
    }
  }

  const handleRestore = async () => {
    try {
      const success = await restore()
      if (success) {
        Alert.alert(t('paywall.alertRestoreSuccessTitle'), t('paywall.alertRestoreSuccessMsg'), [
          { text: t('paywall.confirm'), onPress: () => router.back() },
        ])
      } else {
        Alert.alert(t('paywall.alertRestoreNone'))
      }
    } catch {
      Alert.alert(t('paywall.alertRestoreFailTitle'), t('paywall.alertRetry'))
    }
  }

  // priceString comes from RevenueCat — do NOT translate; store already localises it.
  const priceString = packages.length > 0
    ? packages[0].product.priceString
    : '...'

  const periodText = packages.length > 0
    ? (packages[0].packageType === 'MONTHLY' ? t('paywall.periodMonthly') :
       packages[0].packageType === 'ANNUAL'   ? t('paywall.periodAnnual')  : '')
    : ''

  const priceWithPeriod = `${priceString}${periodText}`

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {/* 닫기 버튼 */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.badge}>PRO</Text>
          <Text style={styles.title}>{t('paywall.title')}</Text>
          <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>
        </View>

        {/* 기능 목록 */}
        <View style={styles.features}>
          {FEATURES.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{t(feature.titleKey)}</Text>
                <Text style={styles.featureDesc}>{t(feature.descKey)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 구매 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.purchaseBtn}
            onPress={handlePurchase}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.purchaseBtnText}>
                {t('paywall.ctaStart', { priceWithPeriod })}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
          >
            <Text style={styles.restoreBtnText}>{t('paywall.restore')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111' },
  content: { flex: 1, padding: 20 },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  closeBtnText: { color: '#666', fontSize: 16 },
  header: { alignItems: 'center', marginBottom: 32 },
  badge: {
    color: '#111',
    backgroundColor: '#4ade80',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: { gap: 16, marginBottom: 32 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  featureEmoji: { fontSize: 28 },
  featureInfo: { flex: 1 },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featureDesc: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  footer: { marginTop: 'auto', gap: 12 },
  purchaseBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  purchaseBtnText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreBtnText: {
    color: '#666',
    fontSize: 14,
  },
})
