// 08 Add friends — invite QR + code, type their six characters, Add → ADDED stamp.
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, type ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { initialsOf, PEOPLE, useStore } from '@/state/store';
import { anim, E, loop, skBlink, skFlip, skPop, skScanQ, skStamp, skUp, skWobble } from '@/theme/anim';
import { C, F } from '@/theme/tokens';
import { A, Icon, ICON, Press, T, useStatusBar } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

const I = C.deep;

// Deterministic 21×21 mock QR (three finder squares + seeded noise).
const QR21: boolean[] = (() => {
  const n = 21;
  const out: boolean[] = [];
  let s = 7;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const fd = (x: number, y: number, ox: number, oy: number) => {
    const dx = x - ox;
    const dy = y - oy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
    return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let v = fd(x, y, 0, 0);
      if (v === null) v = fd(x, y, 14, 0);
      if (v === null) v = fd(x, y, 0, 14);
      if (v === null) {
        const inF = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
        v = inF ? false : rnd() > 0.52;
      }
      out.push(v);
    }
  return out;
})();

const RING = [C.lime, C.ice, C.coral];

function QrCard({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  const cell = 140 / 21;
  return (
    <A
      style={[
        {
          marginTop: 18,
          alignItems: 'center',
          gap: 8,
          borderRadius: 34,
          paddingTop: 20,
          paddingHorizontal: 24,
          paddingBottom: 18,
          backgroundColor: 'rgba(22,33,12,.9)',
          borderWidth: 1.5,
          borderColor: I,
          boxShadow: `5px 5px 0 ${I}, 0 14px 28px rgba(195,234,79,.3)`,
        } as ViewStyle,
        anim(skFlip(), 0.7, 0.2, E.out),
      ]}>
      <View style={{ width: 164, height: 164, padding: 12, backgroundColor: '#fff', borderRadius: 22 }}>
        <View style={{ width: 140, height: 140, overflow: 'hidden' }}>
          <Svg width={140} height={140}>
            {QR21.map((on, i) =>
              on ? <Rect key={i} x={(i % 21) * cell} y={Math.floor(i / 21) * cell} width={cell + 0.3} height={cell + 0.3} fill="#111" /> : null,
            )}
          </Svg>
          <A
            pointerEvents="none"
            style={[
              { position: 'absolute', left: -4, right: -4, top: 0, height: 3, borderRadius: 2, backgroundColor: C.lime, boxShadow: '0 0 10px 3px rgba(195,234,79,.85)' },
              loop(skScanQ(), 2.6, 1),
            ]}
          />
        </View>
        <View style={{ position: 'absolute', left: 62, top: 62, width: 40, height: 40, borderRadius: 12, borderWidth: 4, borderColor: '#fff', backgroundColor: C.lime, overflow: 'hidden' }}>
          <Image source={require('../../assets/brand/logo-lime.png')} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
        <A
          style={[
            {
              position: 'absolute',
              right: -22,
              top: -12,
              backgroundColor: C.lime,
              borderWidth: 1.5,
              borderColor: I,
              borderRadius: 8,
              paddingVertical: 2,
              paddingHorizontal: 7,
              boxShadow: `2px 2px 0 ${I}`,
            },
            loop(skWobble(10), 1.8),
          ]}>
          <T f={F.dm5} s={10} ls={1} c={I}>
            SCAN ME
          </T>
        </A>
      </View>
      <T f={F.b6} s={11.5} ls={1.6} c="rgba(255,255,255,.5)" style={{ marginTop: 6 }}>
        YOUR INVITE CODE
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <T f={F.dm5} s={26} ls={4.3} c={C.lime}>
          K7M · 2QX
        </T>
        <Press
          onPress={onCopy}
          accessibilityLabel="Copy invite link"
          pressed={{ transform: [{ scale: 0.92 }] }}
          style={{ height: 34, minWidth: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.12)', paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
          {copied ? (
            <A style={anim(skPop(), 0.3)}>
              <T f={F.b6} s={12} c={C.lime}>
                Copied
              </T>
            </A>
          ) : (
            <Icon d={ICON.copy} size={14} color="#fff" sw={1.8} />
          )}
        </Press>
      </View>
    </A>
  );
}

export default function Friends() {
  const s = useStore();
  const { top } = useStatusBar();
  const [code, setCode] = useState('R4TQ2P');
  const [copied, setCopied] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const ct = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (ct.current && clearTimeout(ct.current)), []);

  const copy = () => {
    Clipboard.setStringAsync('https://myspace.app/@' + s.handle).catch(() => {});
    setCopied(true);
    if (ct.current) clearTimeout(ct.current);
    ct.current = setTimeout(() => setCopied(false), 1600);
  };

  const mi = code.length === 6 ? (code === 'R4TQ2P' ? 0 : [...code].reduce((a, c) => a + c.charCodeAt(0), 0) % 5) : -1;
  const mu = mi >= 0 ? PEOPLE[mi] : null;
  const count = Object.values(s.fadd).filter(Boolean).length;
  const added = mi >= 0 && !!s.fadd[mi];

  return (
    <Screen bar={I} style={{ backgroundColor: '#C6E9A8' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingTop: top + 7, paddingHorizontal: 24, paddingBottom: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Press
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/chat'))}
              accessibilityLabel="Back"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.65)', borderWidth: 1, borderColor: 'rgba(255,255,255,.7)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICON.back} size={18} color={I} sw={2} />
            </Press>
            <Press
              onPress={copy}
              accessibilityRole="button"
              pressed={{ opacity: 0.8 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                paddingVertical: 12,
                paddingHorizontal: 18,
                backgroundColor: 'rgba(255,255,255,.65)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,.7)',
              }}>
              <Icon d={ICON.share} size={15} color={I} sw={2} />
              <T f={F.b6} s={13.5} c={I}>
                {copied ? 'Copied' : 'Share'}
              </T>
            </Press>
          </View>
          <A style={[{ marginTop: 14 }, anim(skUp(), 0.45, 0.05)]}>
            <T f={F.b7} s={31} lh={33.5} ls={-0.87} c={I}>
              Add a friend
            </T>
          </A>
          <A style={[{ marginTop: 8 }, anim(skUp(), 0.45, 0.12)]}>
            <T s={14} lh={20.3} c="rgba(22,33,12,.62)">
              Let them scan your code, or type in the six characters they send you.
            </T>
          </A>

          <QrCard copied={copied} onCopy={copy} />

          <A style={[{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }, anim(skUp(), 0.4, 0.45)]}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(22,33,12,.1)' }} />
            <T s={13} c={C.deep55}>
              or add theirs
            </T>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(22,33,12,.1)' }} />
          </A>

          <Press onPress={() => input.current?.focus()} accessibilityLabel="Friend code" style={{ marginTop: 14, flexDirection: 'row', gap: 9 }}>
            {Array.from({ length: 6 }, (_, i) => {
              const ch = code[i] || '';
              const cur = i === code.length;
              return (
                <A
                  key={i}
                  style={[
                    {
                      flex: 1,
                      height: 54,
                      borderRadius: 18,
                      backgroundColor: ch || cur ? '#fff' : 'rgba(255,255,255,.6)',
                      borderWidth: cur ? 2 : 0,
                      borderColor: I,
                      boxShadow: ch ? '0 4px 12px rgba(22,33,12,.07)' : 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                    } as ViewStyle,
                    anim(skPop(), 0.35, 0.5 + i * 0.06, E.s14),
                  ]}>
                  {ch ? (
                    <T f={F.dm5} s={24} c={I}>
                      {ch}
                    </T>
                  ) : cur ? (
                    <A style={[{ width: 2, height: 26, backgroundColor: I }, anim(skBlink(), 1, 0, 'linear', 'infinite')]} />
                  ) : null}
                </A>
              );
            })}
            <TextInput
              ref={input}
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              caretHidden
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0, fontSize: 16 }}
            />
          </Press>

          {mu ? (
            <A
              key={'m' + mi}
              style={[
                {
                  marginTop: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  borderRadius: 24,
                  paddingVertical: 12,
                  paddingLeft: 16,
                  paddingRight: 14,
                  backgroundColor: 'rgba(255,255,255,.9)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,.6)',
                  boxShadow: '0 8px 20px rgba(22,33,12,.08)',
                } as ViewStyle,
                anim(skUp(), 0.35, 0, E.out),
              ]}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: RING[mi % 3], alignItems: 'center', justifyContent: 'center' }}>
                <T f={F.b7} s={15} c={I}>
                  {initialsOf(mu[0])}
                </T>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T f={F.b6} s={15.5} c={I}>
                  {mu[0]}
                </T>
                <T s={12.5} c={C.deep55}>
                  @{mu[1]} · {mu[4]}
                </T>
              </View>
              {added ? (
                <Press onPress={() => s.toggleFriend(mi)} accessibilityLabel={`Remove ${mu[0]}`}>
                  <A
                    style={[
                      { borderRadius: 8, borderWidth: 2, borderColor: I, backgroundColor: C.lime, paddingVertical: 4, paddingHorizontal: 9 },
                      anim(skStamp(-8), 0.45, 0, E.out),
                    ]}>
                    <T f={F.dm5} s={11.5} ls={1} c={I}>
                      ADDED ✓
                    </T>
                  </A>
                </Press>
              ) : (
                <Press
                  onPress={() => s.toggleFriend(mi)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${mu[0]}`}
                  pressed={{ transform: [{ translateX: 2 }, { translateY: 2 }], boxShadow: `0 0 0 ${I}` } as ViewStyle}
                  style={{
                    borderRadius: 999,
                    backgroundColor: C.lime,
                    borderWidth: 1.5,
                    borderColor: I,
                    boxShadow: `2px 2px 0 ${I}`,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                  }}>
                  <T f={F.b7} s={14} c={I}>
                    Add
                  </T>
                </Press>
              )}
            </A>
          ) : (
            <View style={{ marginTop: 12, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(22,33,12,.25)', padding: 15 }}>
              <T s={13} c={C.deep55} center>
                {code.length ? `${6 - code.length} more to go…` : 'Type the six characters your friend sent you.'}
              </T>
            </View>
          )}

          <View style={{ flex: 1, minHeight: 20 }} />
          <A style={anim(skUp(), 0.5, 0.7)}>
            <Press
              accessibilityRole="button"
              pressed={{ transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `0 0 0 ${I}` } as ViewStyle}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 999,
                backgroundColor: C.lime,
                borderWidth: 1.5,
                borderColor: I,
                boxShadow: `3px 3px 0 ${I}, 0 10px 24px rgba(122,168,44,.3)`,
                paddingVertical: 17,
              }}>
              <Icon d={ICON.scan} size={18} color={I} sw={1.9} />
              <T f={F.b6} s={16} c={I}>
                Scan their code
              </T>
            </Press>
          </A>
          <Press onPress={() => router.replace('/chat')} accessibilityRole="button" pressed={{ opacity: 0.7 }} style={{ marginTop: 10, paddingVertical: 8 }}>
            <T f={F.b6} s={14.5} c={I} center>
              {count ? 'Go to my space' : 'Skip for now'} →
            </T>
          </Press>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
