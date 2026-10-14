# ---------- 1. 构建阶段 ----------
FROM node:22-alpine AS build
WORKDIR /app

# 先只拷 package.json，装依赖这层能被缓存
COPY package.json ./
RUN npm install --no-audit --no-fund

# 再拷源码并构建（产出 dist/）
COPY . .
RUN npm run build

# ---------- 2. 运行阶段 ----------
# 纯静态站点，用 nginx 托管即可，最终镜像很小
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
