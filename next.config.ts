import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // ⚡ lucide-react 아이콘 트리쉐이킹 강화 → 사용하지 않는 아이콘 번들에서 제거
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
