const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserOrOrgPages = repositoryName?.endsWith(".github.io") ?? false;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (
  process.env.GITHUB_ACTIONS === "true" && repositoryName && !isUserOrOrgPages
    ? `/${repositoryName}`
    : ""
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStaticDemo
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

export default nextConfig;
