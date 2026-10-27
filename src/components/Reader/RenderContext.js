'use client';
import { createContext } from 'react';
export const RenderContext = createContext({
  page: 0,
  pixelRatio: 1,
  marks: {},
  selecting: false,
});
