import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export const Clubs = () => (
  <Svg width={14} height={14} viewBox="0 0 32 32">
    <Circle cx="16" cy="10" r="5" fill="#000" />
    <Circle cx="10" cy="18" r="5" fill="#000" />
    <Circle cx="22" cy="18" r="5" fill="#000" />
    <Path
      fill="#000"
      d="M13 20 L12 28 L20 28 L19 20 Z"
    />
  </Svg>
);

