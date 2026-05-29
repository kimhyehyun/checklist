/**
 * 🛒 코스트코 루틴 장보기 앱
 * - 아이템 탭 → 즉시 리스트에서 사라짐 (체크 처리)
 * - "새 장보기 시작" → 기본 물품 전체 초기화
 * - 하단 입력창 → 임시 아이템 추가
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  SectionList,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  name: string;
  category: string;
  quantity?: number;
}

interface Section {
  title: string;
  data: Item[];
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_ITEMS: Item[] = [
  // 신선식품
  { id: 'd01', name: '소고기',      category: '신선식품' },
  { id: 'd02', name: '연어',        category: '신선식품' },
  // 음료/주류
  { id: 'd03', name: '물',          category: '음료/주류', quantity: 2 },
  { id: 'd04', name: '소주',        category: '음료/주류', quantity: 3 },
  { id: 'd05', name: '맥주',        category: '음료/주류', quantity: 2 },
  { id: 'd06', name: '화이트와인',  category: '음료/주류', quantity: 2 },
  { id: 'd07', name: '와인레드',    category: '음료/주류', quantity: 6 },
  // 가공식품
  { id: 'd08', name: '에너지바',    category: '가공식품' },
  { id: 'd09', name: '원두',        category: '가공식품' },
  { id: 'd10', name: '스트링치즈',  category: '가공식품' },
  // 반려동물
  { id: 'd11', name: '쫑이간식',    category: '반려동물', quantity: 2 },
  // 기타
  { id: 'd12', name: '무릎약',      category: '기타' },
  { id: 'd13', name: '치킨',        category: '기타' },
];

/** 카테고리 표시 순서 */
const CATEGORY_ORDER = ['신선식품', '음료/주류', '가공식품', '반려동물', '기타'];

/** 카테고리별 색상 & 이모지 */
const CATEGORY_META: Record<string, { emoji: string; bg: string; accent: string }> = {
  '신선식품':  { emoji: '🥩', bg: '#F0FAF1', accent: '#2E7D32' },
  '음료/주류': { emoji: '🍺', bg: '#EFF6FF', accent: '#1565C0' },
  '가공식품':  { emoji: '🥫', bg: '#FFF8EC', accent: '#BF6000' },
  '반려동물':  { emoji: '🐾', bg: '#FDF0F6', accent: '#AD1457' },
  '기타':      { emoji: '🛒', bg: '#F3F0FF', accent: '#512DA8' },
};

const DEFAULT_META = CATEGORY_META['기타'];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [items, setItems]       = useState<Item[]>([...DEFAULT_ITEMS]);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // 아이템 탭 → 리스트에서 제거 (체크 처리)
  const handleCheck = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  // 새 장보기 시작 → 기본 물품 초기화
  const handleReset = () => {
    Alert.alert(
      '🛒 새 장보기 시작',
      '기본 물품을 전부 다시 불러올까요?\n임시로 추가한 항목은 사라집니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '시작!',
          onPress: () => setItems([...DEFAULT_ITEMS]),
        },
      ]
    );
  };

  // 임시 아이템 추가
  const handleAddItem = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const newItem: Item = {
      id: `temp-${Date.now()}`,
      name: trimmed,
      category: '기타',
    };
    setItems(prev => [...prev, newItem]);
    setInputText('');
    inputRef.current?.blur();
  };

  // SectionList용 섹션 데이터 생성 (useMemo로 최적화)
  const sections: Section[] = useMemo(() => {
    const presentCategories = new Set(items.map(i => i.category));
    const orderedCategories = [
      ...CATEGORY_ORDER.filter(c => presentCategories.has(c)),
      ...Array.from(presentCategories).filter(c => !CATEGORY_ORDER.includes(c)),
    ];
    return orderedCategories
      .map(cat => ({ title: cat, data: items.filter(i => i.category === cat) }))
      .filter(s => s.data.length > 0);
  }, [items]);

  const totalRemaining = items.length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 헤더 ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>🛒 코스트코 장보기</Text>
          <Text style={styles.subtitle}>
            {totalRemaining > 0
              ? `남은 항목 ${totalRemaining}개`
              : '🎉 다 담았어요!'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleReset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetBtnText}>새 장보기{'\n'}시작</Text>
        </TouchableOpacity>
      </View>

      {/* ── 장보기 리스트 ───────────────────────────────────────────── */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}

        renderSectionHeader={({ section }) => {
          const meta = CATEGORY_META[section.title] ?? DEFAULT_META;
          return (
            <View style={[styles.sectionHeader, { backgroundColor: meta.bg }]}>
              <Text style={[styles.sectionTitle, { color: meta.accent }]}>
                {meta.emoji}{'  '}{section.title}
              </Text>
              <View style={[styles.sectionBadge, { backgroundColor: meta.accent }]}>
                <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
              </View>
            </View>
          );
        }}

        renderItem={({ item, index, section }) => {
          const isLast = index === section.data.length - 1;
          const isTemp = item.id.startsWith('temp-');
          return (
            <TouchableOpacity
              style={[styles.itemRow, isLast && styles.itemRowLast]}
              onPress={() => handleCheck(item.id)}
              activeOpacity={0.45}
            >
              {/* 체크박스 */}
              <View style={styles.checkboxOuter} />

              {/* 이름 */}
              <Text style={[styles.itemName, isTemp && styles.itemNameTemp]}>
                {item.name}
              </Text>

              {/* 수량 뱃지 */}
              {item.quantity != null && (
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>×{item.quantity}</Text>
                </View>
              )}

              {/* 임시 항목 표시 */}
              {isTemp && (
                <View style={styles.tempBadge}>
                  <Text style={styles.tempBadgeText}>임시</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}

        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>장보기 완료!</Text>
            <Text style={styles.emptyDesc}>모든 항목을 카트에 담았어요.</Text>
            <TouchableOpacity style={styles.emptyResetBtn} onPress={handleReset}>
              <Text style={styles.emptyResetText}>새 장보기 시작하기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* ── 하단 입력바 ─────────────────────────────────────────────── */}
      <View style={styles.inputBar}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="임시 항목 추가  (예: 케이크)"
          placeholderTextColor="#BBBBBB"
          returnKeyType="done"
          onSubmitEditing={handleAddItem}
        />
        <TouchableOpacity
          style={[
            styles.addBtn,
            !inputText.trim() && styles.addBtnDisabled,
          ]}
          onPress={handleAddItem}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>추가</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 3,
    fontWeight: '500',
  },
  resetBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── List ────────────────────────────────────────────────────────────
  listContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },

  // ── Section Header ──────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  sectionBadge: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 2,
    minWidth: 26,
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Item Row ────────────────────────────────────────────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,      // ← 넉넉한 터치 영역
    minHeight: 58,            // ← 최소 높이 보장
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  itemRowLast: {
    borderBottomWidth: 0,
    marginBottom: 6,
  },
  checkboxOuter: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FAFAFA',
    marginRight: 14,
    flexShrink: 0,
  },
  itemName: {
    flex: 1,
    fontSize: 17,
    color: '#1A1A1A',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  itemNameTemp: {
    color: '#555555',
  },
  qtyBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginLeft: 8,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tempBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 6,
  },
  tempBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },

  // ── Empty State ──────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 28,
    textAlign: 'center',
  },
  emptyResetBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyResetText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Input Bar ────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#F4F6F8',
    borderRadius: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111111',
  },
  addBtn: {
    height: 48,
    paddingHorizontal: 22,
    backgroundColor: '#2563EB',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
