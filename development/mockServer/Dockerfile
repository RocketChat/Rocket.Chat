FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /mock-server .

FROM scratch
COPY --from=build /mock-server /mock-server
EXPOSE 8080
ENTRYPOINT ["/mock-server"]
