# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

All project guidance lives in AGENTS.md so every coding agent reads the same rules:

@AGENTS.md

## Claude-specific notes

- `dig` is available locally (`/usr/bin/dig`, BIND 9.10). Use it to check output formats before writing evidence. It's old enough to print Extended DNS Errors as raw `OPT=15` bytes; the evidence uses the `; EDE: <code> (<name>)` format that current dig prints.
- `kubectl` isn't installed. Check Kubernetes output against kubernetes.io docs instead.
