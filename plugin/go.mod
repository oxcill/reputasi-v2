cat << 'EOF' > ~/reputasi-v2/plugin/go.mod
module github.com/username/reputasi-v2

go 1.23.0

require (
	github.com/canopy-network/canopy v0.0.0
)

replace github.com/canopy-network/canopy => ../../canopy
EOF
