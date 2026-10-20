// Cobalt logo screen shown while fonts load and the session is restored. Matches the web
// template's #boot block and the native splash, so launch never flashes white.
import { Image } from 'expo-image';
import { View, type ViewStyle } from 'react-native';

export function Boot() {
  return (
    <View
      style={
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#2B4BFF',
          backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(158,179,255,.6), rgba(43,75,255,0) 55%)',
        } as ViewStyle
      }>
      <View
        style={
          {
            width: 132,
            height: 132,
            borderRadius: 34,
            borderWidth: 4,
            borderColor: '#111',
            backgroundImage: 'radial-gradient(circle at 30% 22%, #FFF0A8, #FFD23F 50%, #F2B90F)',
            boxShadow: '0 0 0 7px #fff, 0 0 0 10px #111, 8px 10px 0 10px #111, 0 26px 40px rgba(0,0,40,.4)',
            transform: [{ rotate: '-6deg' }],
            alignItems: 'center',
            justifyContent: 'center',
          } as ViewStyle
        }>
        <Image source={require('../../assets/images/boot-logo.png')} style={{ width: 88, height: 88 }} contentFit="contain" />
      </View>
    </View>
  );
}
