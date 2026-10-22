// Catching and reading a Throw letter in the chat thread (Chat Thread · Sticker):
//  caught    – the plane swoops into your hands and hovers; flick it up (a ring fills) to unfold
//  unfolding – it spins and opens into a creased sheet that flattens
//  read      – words ink in, photos/videos drop in as taped polaroids, the signature draws itself;
//              Hold to hug (hearts float up) and Write back (opens Throw to this friend)
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';

import { anim, loop } from '@/theme/anim';
import { AutoplayVideoFill } from '../../AutoplayVideoFill';
import { INK_BLUE } from '../../throw/LetterCanvas';
import { PaperPlaneStage } from '../../throw/PaperPlaneStage';
import type { PaperPlaneStageHandle } from '../../throw/paperPlaneTypes';
import {
  A,
  buzz,
  COBALT,
  ctArrowUp,
  ctCatchPop,
  ctDrawLine,
  ctFade,
  ctFadeOut,
  ctHeartUp,
  ctHover,
  ctIn,
  ctInk,
  ctPlaneUnfold,
  ctPoke,
  ctPolaroid,
  ctPop,
  ctPulsePlay,
  ctReadIn,
  ctSheetOpen,
  ctStamp,
  Heart,
  INK,
  LIME,
  mono,
  PaperPlaneArt,
  PAPER,
  SEND_PATH,
  SPRING,
  SPRING_SOFT,
} from './threadFx';

export interface CatchLetter {
  id: string;
  mine: boolean;
  friendName: string;
  city: string | null;
  time: string;
  text: string;
  media: string[];
  /** Hugs the recipient has sent back so far. */
  hugs: number;
}

const isVideo = (url: string) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
const FLICK = 110;
const RING = 176;

export function CatchLetterOverlay({
  letter,
  startRead,
  topInset,
  onClose,
  onUnfolded,
  onWriteBack,
  toast,
  onHugs,
}: {
  letter: CatchLetter;
  startRead: boolean;
  topInset: number;
  onClose: () => void;
  onUnfolded: () => void;
  onWriteBack: () => void;
  toast: (msg: string) => void;
  /** Recipient let go of Hold to hug after sending `n` hugs. */
  onHugs?: (n: number) => void;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const [stage, setStage] = useState<'caught' | 'unfolding' | 'read'>(startRead ? 'read' : 'caught');
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [poke, setPoke] = useState(0);
  const [hugging, setHugging] = useState(false);
  const [hugN, setHugN] = useState(letter.hugs);
  const [hearts, setHearts] = useState<{ k: number; x: number; r: number; s: number; c: string }[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hugTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const crossed = useRef(false);
  const hugCount = useRef(0);
  // The same 3D paper plane as the Throw screen: dragging up scrubs its fold backwards (folded
  // plane → flat sheet). Falls back to the flat SVG plane if WebGL isn't available.
  const stageRef = useRef<PaperPlaneStageHandle>(null);
  const [stageFailed, setStageFailed] = useState(false);
  const [unfoldU, setUnfoldU] = useState(0);
  const unfoldRef = useRef(0);
  const draggingRef = useRef(false);
  const raf = useRef<number | null>(null);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      if (hugTimer.current) clearInterval(hugTimer.current);
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const first = letter.friendName.trim().split(/\s+/)[0] || 'them';
  const use3d = !stageFailed;
  const prog = use3d ? Math.min(1, unfoldU / 0.5) : Math.min(1, Math.max(0, -dy / FLICK));
  const planeTop = Math.round(H * 0.4);
  const sheetTop = topInset + 56;
  const sheetW = W - 32;
  const sheetH = H - sheetTop - 26;
  const dragDist = Math.max(220, sheetH * 0.55);

  // Bake the letter onto the plane and start fully folded.
  useEffect(() => {
    if (stage !== 'caught' || stageFailed) return;
    const photo = letter.media.find((u) => !isVideo(u)) ?? null;
    const bake = () => stageRef.current?.setContent({ messageText: letter.text, strokes: null, penColor: INK_BLUE, photoUri: photo, isNight: false }, { width: sheetW, height: sheetH });
    stageRef.current?.setOptions({ zoomOut: 1.55, follow: false });
    bake();
    // The 3D engine only starts once it has measured its box (and three.js may still be loading),
    // so keep re-applying the current fold and re-baking the letter until it has surely picked them up.
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      stageRef.current?.setOptions({ zoomOut: 1.55, follow: false });
      if (!draggingRef.current) stageRef.current?.seek(1 - unfoldRef.current);
      if (n % 5 === 0) bake();
      if (n >= 20) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage === 'caught', stageFailed]);

  const setUnfold = (u: number) => {
    unfoldRef.current = u;
    setUnfoldU(u);
    stageRef.current?.seek(1 - u);
  };
  /** Eases the unfold to `to` (1 = flat sheet, 0 = folded plane). */
  const animateUnfold = (to: number, ms: number, done?: () => void) => {
    if (raf.current) cancelAnimationFrame(raf.current);
    const from = unfoldRef.current;
    const t0 = Date.now();
    const step = () => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setUnfold(from + (to - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else done?.();
    };
    raf.current = requestAnimationFrame(step);
  };
  const finish3dUnfold = () => {
    buzz(true);
    setDragging(false);
    animateUnfold(1, 420, () => {
      onUnfolded();
      setStage('read');
    });
  };

  const unfold = () => {
    buzz(true);
    setStage('unfolding');
    setDy(0);
    setDragging(false);
    onUnfolded();
    later(() => setStage('read'), 1150);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(stage === 'caught')
    .onBegin(() => {
      crossed.current = false;
      draggingRef.current = true;
      setDragging(true);
    })
    .onUpdate((e) => {
      if (use3d) {
        const u = Math.min(1, Math.max(0, -e.translationY / dragDist));
        if (u >= 0.5 && !crossed.current) {
          crossed.current = true;
          buzz();
        }
        setUnfold(u);
        return;
      }
      const d = Math.min(30, e.translationY);
      if (d < -FLICK && !crossed.current) {
        crossed.current = true;
        buzz();
      }
      setDy(d);
    })
    .onEnd((e) => {
      if (use3d) {
        const u = unfoldRef.current;
        if (u >= 0.5 || (u > 0.12 && e.velocityY < -700)) finish3dUnfold();
        else {
          setDragging(false);
          animateUnfold(0, 320);
        }
        return;
      }
      const d = e.translationY;
      if (d < -FLICK || (d < -36 && e.velocityY < -700)) unfold();
      else {
        setDy(0);
        setDragging(false);
      }
    })
    .onFinalize(() => {
      draggingRef.current = false;
      setDragging(false);
    });
  const tap = Gesture.Tap()
    .runOnJS(true)
    .enabled(stage === 'caught')
    .onEnd((_e, ok) => {
      if (!ok) return;
      buzz();
      setPoke((n) => n + 1);
      toast(use3d ? 'Hold and drag it upward to unfold' : 'Flick it upward to unfold');
    });

  const startHug = () => {
    buzz();
    setHugging(true);
    hugCount.current = 0;
    let n = 0;
    if (hugTimer.current) clearInterval(hugTimer.current);
    hugTimer.current = setInterval(() => {
      n += 1;
      hugCount.current = n;
      buzz();
      setHearts((h) => [
        ...h.slice(-30),
        { k: Date.now() + n, x: 20 + Math.round(Math.random() * (W - 110)), r: Math.round(Math.random() * 40 - 20), s: Math.round((0.8 + Math.random() * 0.9) * 10) / 10, c: ['#FF5C8A', '#FFB4C8', '#FF8A6B'][n % 3] },
      ]);
    }, 120);
  };
  const endHug = () => {
    if (!hugging) return;
    if (hugTimer.current) clearInterval(hugTimer.current);
    hugTimer.current = null;
    setHugging(false);
    const sent = hugCount.current;
    if (sent) {
      setHugN((x) => x + sent);
      onHugs?.(sent);
      toast(`${first} felt your hug ×${sent}`);
    }
    later(() => setHearts([]), 1400);
  };

  // The sender sees every hug they've been given float up each time they open their letter.
  const replayed = useRef(false);
  useEffect(() => {
    if (stage !== 'read' || !letter.mine || letter.hugs <= 0 || replayed.current) return;
    replayed.current = true;
    const total = Math.min(letter.hugs, 40);
    for (let i = 0; i < total; i++) {
      later(() => {
        if (i % 4 === 0) buzz();
        setHearts((h) => [
          ...h.slice(-40),
          { k: Date.now() + i, x: 20 + Math.round(Math.random() * (W - 110)), r: Math.round(Math.random() * 40 - 20), s: Math.round((0.8 + Math.random() * 0.9) * 10) / 10, c: ['#FF5C8A', '#FFB4C8', '#FF8A6B'][i % 3] },
        ]);
      }, 700 + i * 110);
    }
    later(() => setHearts([]), 700 + total * 110 + 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const words = letter.text.split(/\s+/).filter(Boolean);
  const wordDelay = (i: number) => 0.25 + Math.min(i, 40) * 0.07;
  const wEnd = wordDelay(words.length);
  const hasMedia = letter.media.length > 0;
  const signD = wEnd + (hasMedia ? 0.45 : 0.1);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
      <A style={[StyleSheet.absoluteFill, styles.backdrop, anim(ctFade(), 0.25, 0, 'ease-out')]} />

      {stage === 'caught' ? (
        <GestureDetector gesture={Gesture.Simultaneous(pan, tap)}>
          <View style={StyleSheet.absoluteFill}>
            <A pointerEvents="none" style={[styles.caughtTitle, { top: topInset + 60 }, anim(ctIn(), 0.4, 0.15, 'ease-out')]}>
              <Text style={mono(11, LIME, 2)}>CAUGHT ONE!</Text>
              <Text style={styles.caughtFrom}>
                From {first}
                {letter.city ? ` · ${letter.city}` : ''}
              </Text>
            </A>
            {use3d ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: 16, top: sheetTop, width: sheetW, height: sheetH }}>
                {/* The flat sheet takes over from the 3D paper over the last stretch, as on Throw. */}
                <View style={[StyleSheet.absoluteFill, styles.flatSheet, { opacity: Math.max(0, (unfoldU - 0.8) / 0.2) }]} />
                <A style={[{ flex: 1 }, anim(ctCatchPop(), 0.65, 0, SPRING)]}>
                  <A key={poke} style={[{ flex: 1 }, poke ? anim(ctPoke(poke % 2 ? 'A' : 'B'), 0.45, 0, 'ease-out') : !dragging && unfoldU === 0 ? loop(ctHover(), 2.4) : null]}>
                    <View style={{ flex: 1, opacity: Math.min(1, (1 - unfoldU) / 0.2) }}>
                      <PaperPlaneStage ref={stageRef} onError={() => setStageFailed(true)} />
                    </View>
                  </A>
                </A>
              </View>
            ) : (
            <View
              pointerEvents="none"
              style={[
                styles.planeBox,
                { left: W / 2 - 110, top: planeTop - 100, transform: [{ translateY: dy }, { rotate: `${(dy * 0.12).toFixed(1)}deg` }, { scale: 1 + prog * 0.12 }] },
                !dragging && ({ transitionProperty: 'transform', transitionDuration: '0.5s', transitionTimingFunction: SPRING } as unknown as ViewStyle),
              ]}
            >
              <A style={anim(ctCatchPop(), 0.65, 0, SPRING)}>
                <A key={poke} style={poke ? anim(ctPoke(poke % 2 ? 'A' : 'B'), 0.45, 0, 'ease-out') : loop(ctHover(), 2.4)}>
                  <PaperPlaneArt width={220} />
                </A>
              </A>
            </View>
            )}
            <View pointerEvents="none" style={styles.flickBox}>
              <View style={{ width: 64, height: 64 }}>
                <Svg width={64} height={64} viewBox="0 0 64 64" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx={32} cy={32} r={28} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth={4} />
                  <Circle cx={32} cy={32} r={28} fill="none" stroke={LIME} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${RING}`} strokeDashoffset={RING * (1 - prog)} />
                </Svg>
                <A style={[{ position: 'absolute', left: 19, top: 19 }, loop(ctArrowUp(), 1)]}>
                  <Svg width={26} height={26} viewBox="0 0 24 24">
                    <Path d="M12 19V5 M6 11l6-6 6 6" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </A>
              </View>
              <Text style={[mono(12, '#fff', 2), { fontFamily: 'SpaceMono_700Bold' }]}>{prog >= 1 ? 'LET GO!' : prog > 0.05 ? 'KEEP GOING…' : use3d ? 'HOLD & DRAG UP TO UNFOLD' : 'FLICK UP TO UNFOLD'}</Text>
            </View>
          </View>
        </GestureDetector>
      ) : null}

      {stage === 'unfolding' ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <A style={[styles.planeBox, { left: W / 2 - 110, top: planeTop - 100 }, anim(ctPlaneUnfold(), 0.6, 0, 'ease-in')]}>
            <PaperPlaneArt width={220} />
          </A>
          <A style={[styles.unfoldSheet, { top: topInset + 56, height: Math.min(600, H - topInset - 90) }, anim(ctSheetOpen(), 0.75, 0.3, SPRING_SOFT)]}>
            <A style={[StyleSheet.absoluteFill, anim(ctFadeOut(), 1, 0.45, 'ease-out')]}>
              <Svg width="100%" height="100%" viewBox="0 0 342 600" preserveAspectRatio="none">
                <Path d="M171 0V600 M0 0 171 200 M342 0 171 200 M0 200 171 400 M342 200 171 400" fill="none" stroke="#2440C8" strokeWidth={2.2} strokeDasharray="8 6" opacity={0.55} />
              </Svg>
            </A>
          </A>
        </View>
      ) : null}

      {stage === 'read' ? (
        <A style={[styles.readWrap, { top: topInset + 56 }, anim(ctReadIn(), 0.3, 0, 'ease-out')]}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.sheet, { transform: [{ scale: hugging ? 0.97 : 1 }] }]}>
              <View style={styles.sheetHead}>
                <A style={[styles.stamp, anim(ctStamp(), 0.45, 0.15, SPRING)]}>
                  <Text style={styles.stampText}>{letter.mine ? `TO ${first.toUpperCase()}` : `FROM ${first.toUpperCase()}`}</Text>
                </A>
                <Text style={[mono(10.5, 'rgba(17,17,17,.45)', 1), { textAlign: 'right', lineHeight: 15 }]}>
                  {letter.city ? letter.city.toUpperCase() + '\n' : ''}
                  {letter.time}
                </Text>
              </View>
              <View style={styles.words}>
                {words.map((w, i) => (
                  <A key={i} style={anim(ctInk(), 0.4, wordDelay(i), 'ease-out')}>
                    <Text style={styles.word}>{w}</Text>
                  </A>
                ))}
              </View>
              {hasMedia ? (
                <View style={styles.mediaRow}>
                  {letter.media.slice(0, 4).map((url, i) => {
                    const r = i % 2 ? 4 : -4;
                    const vid = isVideo(url);
                    return (
                      <A key={url + i} style={anim(ctPolaroid(r), 0.55, wEnd + i * 0.08, SPRING)}>
                        <Pressable
                          onPress={() => {
                            buzz();
                            if (vid) setVideo(url);
                            else setLightbox(url);
                          }}
                          accessibilityRole="imagebutton"
                          accessibilityLabel={vid ? 'Play video' : 'Open photo'}
                          style={({ pressed }) => [styles.polaroid, pressed && { transform: [{ scale: 1.04 }] }]}
                        >
                          <View style={styles.polaroidImg}>
                            {vid ? (
                              <View style={styles.videoTile}>
                                <A style={[styles.playBtn, loop(ctPulsePlay(), 1.6)]}>
                                  <Svg width={16} height={16} viewBox="0 0 24 24">
                                    <Path d="M7 4v16l13-8z" fill={INK} />
                                  </Svg>
                                </A>
                              </View>
                            ) : (
                              <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                            )}
                          </View>
                          <Text style={styles.polaroidLabel}>{vid ? 'Video · tap' : 'Photo · tap'}</Text>
                          <View style={[styles.tape, { transform: [{ rotate: `${-r}deg` }] }]} />
                        </Pressable>
                      </A>
                    );
                  })}
                </View>
              ) : null}
              {letter.mine && letter.hugs > 0 ? (
                <A style={[styles.huggedChip, anim(ctPop('A'), 0.45, 0.6, SPRING)]}>
                  <Heart size={16} />
                  <Text style={styles.huggedText}>
                    {first} hugged your letter ×{letter.hugs}
                  </Text>
                </A>
              ) : null}
              <A style={[styles.signRow, anim(ctInk(), 0.4, signD, 'ease-out')]}>
                <Text style={styles.sign}>{letter.mine ? '— You' : `— ${first}`}</Text>
                <A style={[styles.signLine, { transformOrigin: '0% 50%' } as ViewStyle, anim(ctDrawLine(), 0.6, signD, 'ease-out')]}>
                  <Svg width={100} height={10} viewBox="0 0 90 10">
                    <Path d="M2 6 C20 0 40 10 60 4 S 84 6 88 3" fill="none" stroke={INK_BLUE} strokeWidth={2.2} strokeLinecap="round" />
                  </Svg>
                </A>
              </A>
              {!letter.mine ? (
                <>
                  <View style={{ flexGrow: 1, minHeight: 18 }} />
                  <View style={styles.actions}>
                    <Pressable
                      onPressIn={startHug}
                      onPressOut={endHug}
                      accessibilityRole="button"
                      accessibilityLabel="Hold to hug"
                      style={[styles.hugBtn, hugging && styles.hugBtnOn]}
                    >
                      <Heart size={18} />
                      <Text style={styles.actionText}>{hugging ? 'Hugging…' : hugN ? `Hugged ×${hugN}` : 'Hold to hug'}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        buzz();
                        toast(`Opening Throw · to ${first}`);
                        later(onWriteBack, 500);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Write back"
                      style={({ pressed }) => [styles.writeBtn, pressed && styles.pushed]}
                    >
                      <Svg width={16} height={16} viewBox="0 0 24 24">
                        <Path d={SEND_PATH} fill="#fff" />
                      </Svg>
                      <Text style={[styles.actionText, { color: '#fff' }]}>Write back</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
              {hearts.map((h) => (
                <A key={h.k} pointerEvents="none" style={[{ position: 'absolute', left: h.x, bottom: 90 }, anim(ctHeartUp(h.r, h.s), 1.3, 0, 'ease-out')]}>
                  <Heart size={28} fill={h.c} />
                </A>
              ))}
            </View>
          </ScrollView>
        </A>
      ) : null}

      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close letter" style={[styles.closeBtn, { top: topInset + 8 }]}>
        <Svg width={14} height={14} viewBox="0 0 24 24">
          <Path d="M6 6l12 12 M18 6 6 18" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </Pressable>

      {lightbox ? (
        <Pressable onPress={() => setLightbox(null)} accessibilityRole="button" accessibilityLabel="Close photo" style={[StyleSheet.absoluteFill, styles.lightbox]}>
          <A style={[styles.lightboxCard, anim(ctPop('B'), 0.4, 0, SPRING)]}>
            <Image source={{ uri: lightbox }} style={{ width: '100%', height: 300 }} resizeMode="cover" />
          </A>
          <Text style={mono(11, 'rgba(255,255,255,.7)', 1.4)}>TAP ANYWHERE TO CLOSE</Text>
        </Pressable>
      ) : null}
      {video ? (
        <View style={[StyleSheet.absoluteFill, styles.videoOverlay]}>
          <A style={[styles.videoFrame, anim(ctPop('A'), 0.4, 0, SPRING)]}>
            <AutoplayVideoFill uri={video} />
          </A>
          <Pressable onPress={() => setVideo(null)} accessibilityRole="button" accessibilityLabel="Close video" style={[styles.closeBtn, { top: topInset + 8 }]}>
            <Svg width={14} height={14} viewBox="0 0 24 24">
              <Path d="M6 6l12 12 M18 6 6 18" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(20,26,44,.78)' },
  closeBtn: { position: 'absolute', right: 18, zIndex: 50, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  caughtTitle: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  caughtFrom: { marginTop: 6, fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 28, letterSpacing: -0.8, color: '#fff' },
  planeBox: { position: 'absolute', width: 220, height: 200 },
  flickBox: { position: 'absolute', left: 0, right: 0, bottom: 90, alignItems: 'center', gap: 8 },
  unfoldSheet: { position: 'absolute', left: 24, right: 24, borderRadius: 26, backgroundColor: PAPER, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.35)' } as ViewStyle,
  huggedChip: { alignSelf: 'center', marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#FFE1EA', borderWidth: 2, borderColor: INK },
  huggedText: { fontFamily: 'Figtree_800ExtraBold', fontSize: 13.5, color: INK },
  flatSheet: { borderRadius: 26, backgroundColor: PAPER },
  readWrap: { position: 'absolute', left: 16, right: 16, bottom: 26, borderRadius: 26 },
  sheet: { flexGrow: 1, borderRadius: 26, backgroundColor: PAPER, padding: 20, boxShadow: '0 20px 50px rgba(0,0,0,.35)', transitionProperty: 'transform', transitionDuration: '0.3s' } as unknown as ViewStyle,
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stamp: { borderWidth: 3, borderColor: '#2F4BE0', borderRadius: 9, paddingVertical: 3, paddingHorizontal: 10 },
  stampText: { fontFamily: 'SpaceMono_700Bold', fontSize: 13, letterSpacing: 1.8, color: '#2F4BE0' },
  words: { marginTop: 26, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 5 },
  // Same hand as the Throw screen's letter (LetterCanvas typedInput).
  word: { fontFamily: 'Caveat_500Medium', fontSize: 22, lineHeight: 30, color: INK_BLUE },
  mediaRow: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  polaroid: { width: 140, padding: 6, paddingBottom: 24, backgroundColor: '#fff', boxShadow: '0 6px 14px rgba(0,0,0,.2)' } as ViewStyle,
  polaroidImg: { height: 110, backgroundColor: '#1B1E27', overflow: 'hidden' },
  polaroidLabel: { position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center', fontFamily: 'Figtree_600SemiBold', fontSize: 11.5, color: 'rgba(17,17,17,.5)' },
  tape: { position: 'absolute', left: '50%', top: -8, marginLeft: -22, width: 44, height: 16, backgroundColor: 'rgba(255,236,150,.8)' },
  videoTile: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B4FB0' },
  playBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center' },
  signRow: { marginTop: 12, alignItems: 'flex-end' },
  sign: { fontFamily: 'Caveat_500Medium', fontSize: 22, lineHeight: 30, color: INK_BLUE },
  signLine: {},
  actions: { marginTop: 18, marginBottom: 4, flexDirection: 'row', gap: 10 },
  hugBtn: { flex: 1, height: 52, borderRadius: 999, backgroundColor: '#fff', borderWidth: 2.5, borderColor: INK, boxShadow: `3px 3px 0 ${INK}`, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 } as ViewStyle,
  hugBtnOn: { backgroundColor: '#FFB4C8', boxShadow: `0 0 0 ${INK}` } as ViewStyle,
  writeBtn: { flex: 1, height: 52, borderRadius: 999, backgroundColor: COBALT, borderWidth: 2.5, borderColor: INK, boxShadow: `3px 3px 0 ${INK}`, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 } as ViewStyle,
  pushed: { transform: [{ translateX: 3 }, { translateY: 3 }], boxShadow: `0 0 0 ${INK}` } as ViewStyle,
  actionText: { fontFamily: 'Figtree_800ExtraBold', fontSize: 15, color: INK },
  lightbox: { zIndex: 60, backgroundColor: 'rgba(17,17,17,.82)', alignItems: 'center', justifyContent: 'center', gap: 18 },
  lightboxCard: { width: 310, padding: 10, paddingBottom: 40, backgroundColor: '#fff', transform: [{ rotate: '-2deg' }] },
  videoOverlay: { zIndex: 60, backgroundColor: 'rgba(10,12,20,.92)', alignItems: 'center', justifyContent: 'center' },
  videoFrame: { width: 320, height: 440, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
});
