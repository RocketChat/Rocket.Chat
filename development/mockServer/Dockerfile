FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mock-server .
RUN adduser -D -u 1001 mockuser

FROM scratch
COPY --from=build /etc/passwd /etc/passwd
COPY --from=build /mock-server /mock-server
USER mockuser
EXPOSE 8080
ENTRYPOINT ["/mock-server"]
