import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#6366f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          paddingBottom: 4,
        }}
      >
        {[10, 18, 14, 22].map((h, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: h,
              borderRadius: 2,
              background: 'white',
              opacity: i === 3 ? 1 : 0.7,
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
