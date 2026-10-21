#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$ROOT_DIR"

if [ ! -x ./pocketbase ]; then
	printf '%s\n' 'PocketBase binary missing or not executable: ./pocketbase' >&2
	exit 1
fi

exec ./pocketbase migrate up "$@"