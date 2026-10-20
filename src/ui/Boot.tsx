// Launch screen. The real picture is drawn outside React so it shows instantly: on web it's the
// `#boot` block in public/index.html (the splash's stickers + wordmark as a still image), on
// device the native splash screen. While the app loads, React renders just the matching cobalt
// behind it; `hideBoot()` lifts the launch screen once the first real screen can draw.
import * as SplashScreen from 'expo-splash-screen';
import { Platform, View } from 'react-native';

export function Boot() {
  return <View style={{ flex: 1, backgroundColor: '#2B4BFF' }} />;
}

let hidden = false;

export function hideBoot() {
  if (hidden) return;
  hidden = true;
  if (Platform.OS !== 'web') {
    SplashScreen.hideAsync().catch(() => {});
    return;
  }
  if (typeof document === 'undefined') return;
  const el = document.getElementById('boot');
  if (!el) return;
  // A beat for the first screen to paint underneath, then fade out.
  setTimeout(() => {
    el.classList.add('gone');
    setTimeout(() => el.remove(), 260);
  }, 120);
}
