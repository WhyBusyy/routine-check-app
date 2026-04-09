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

const FEATURES = [
  { emoji: '📊', title: '상세 통계', desc: '주간/월간 분석, 루틴별 달성률' },
  { emoji: '🔔', title: '맞춤 알림', desc: '시간대별 알림 커스텀 설정' },
  { emoji: '🎨', title: '위젯 테마', desc: '위젯 디자인 커스터마이징' },
  { emoji: '♾️', title: '무제한 루틴', desc: '루틴 개수 제한 없이 추가' },
]

export default function PaywallScreen() {
  const router = useRouter()
  const { packages, loading, purchase, restore } = usePurchases()

  const handlePurchase = async () => {
    if (packages.length === 0) {
      Alert.alert('현재 구매할 수 있는 상품이 없습니다')
      return
    }
    try {
      const success = await purchase(packages[0])
      if (success) {
        Alert.alert('구매 완료!', 'Pro 기능이 활성화되었습니다', [
          { text: '확인', onPress: () => router.back() },
        ])
      }
    } catch {
      Alert.alert('구매 실패', '다시 시도해주세요')
    }
  }

  const handleRestore = async () => {
    try {
      const success = await restore()
      if (success) {
        Alert.alert('복원 완료!', 'Pro 기능이 활성화되었습니다', [
          { text: '확인', onPress: () => router.back() },
        ])
      } else {
        Alert.alert('복원할 구매 내역이 없습니다')
      }
    } catch {
      Alert.alert('복원 실패', '다시 시도해주세요')
    }
  }

  const priceText = packages.length > 0
    ? packages[0].product.priceString
    : '...'

  const periodText = packages.length > 0
    ? (packages[0].packageType === 'MONTHLY' ? '/월' :
       packages[0].packageType === 'ANNUAL' ? '/년' : '')
    : ''

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
          <Text style={styles.title}>루틴 체크 Pro</Text>
          <Text style={styles.subtitle}>
            더 깊은 분석과 커스텀 기능으로{'\n'}루틴 관리를 한 단계 업그레이드
          </Text>
        </View>

        {/* 기능 목록 */}
        <View style={styles.features}>
          {FEATURES.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
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
                {priceText}{periodText}으로 시작하기
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
          >
            <Text style={styles.restoreBtnText}>구매 복원</Text>
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
