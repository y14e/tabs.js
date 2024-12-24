// grapheme-length [20241224]
export function getGraphemeLength(a) {
  return [...new Intl.Segmenter().segment(a)].length;
};