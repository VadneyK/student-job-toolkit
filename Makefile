# Release path for the Student Job Kit on GitHub Pages. `make ship` is the only way to release.
# make check : build the prompts into the kit page, text check, phone test, layout-check at nine widths (local)
# make ship  : check, push main, wait for the Pages deploy (.github/workflows/pages.yml), smoke-test the live site,
#              and revert the release if the smoke test fails
SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
REPO    := VadneyK/student-job-toolkit
LIVE    := https://vadneyk.github.io/student-job-toolkit/
WIDTHS  := 320,375,414,768,1024,1280,1440,1920,2560
PORT    ?= 8772
OUT     ?= .layout-check
NODE    := node $(shell node -e "process.exit(typeof WebSocket==='undefined'?0:1)" && echo --experimental-websocket)
GHTOKEN  = $${GH_TOKEN:-$$(gh auth token -u VadneyK)}
PUSH     = git -c http.postBuffer=524288000 push "https://VadneyK:$(GHTOKEN)@github.com/$(REPO).git" main 2>&1 | sed -E 's/gh[op]_[A-Za-z0-9]+/***/g'

.PHONY: deps test check ship
deps:
	@[ -d node_modules/axe-core ] || npm i --silent --no-save axe-core@4.14.0

test:
	@before=$$(shasum kit-page/index.html); node tools/build.mjs; \
	[ "$$before" = "$$(shasum kit-page/index.html)" ] || echo "Note: the build updated kit-page/index.html from prompts/. Commit it before make ship."
	node tools/check.mjs
	SHOTS=$(OUT)/shots $(NODE) tests/phone-test.mjs

# Serve the repo locally, run the layout check on the landing page and the kit page, always stop the server.
check: deps test
	python3 -m http.server $(PORT) >/dev/null 2>&1 & srv=$$!; trap "kill $$srv" EXIT; \
	for i in $$(seq 1 40); do curl -sf -o /dev/null http://127.0.0.1:$(PORT)/ && break; sleep 0.25; done; \
	$(NODE) tests/layout-check.mjs http://127.0.0.1:$(PORT)/ --widths $(WIDTHS) --out $(OUT)/local-home; \
	$(NODE) tests/layout-check.mjs http://127.0.0.1:$(PORT)/kit-page/ --widths $(WIDTHS) --out $(OUT)/local-kit

ship: check
	@[ "$$(git rev-parse --abbrev-ref HEAD)" = main ] || { echo "Ship from main."; exit 1; }
	@[ -z "$$(git status --porcelain)" ] || { echo "Commit your changes first."; exit 1; }
	git fetch -q "https://VadneyK:$(GHTOKEN)@github.com/$(REPO).git" main; \
	prev=$$(git rev-parse FETCH_HEAD); head=$$(git rev-parse HEAD); echo "live before ship: $$prev"; \
	if [ "$$prev" = "$$head" ]; then echo "Nothing new to ship."; exit 0; fi; \
	$(PUSH); \
	st=""; for i in $$(seq 1 90); do \
	  st=$$(GH_TOKEN=$(GHTOKEN) gh run list --repo $(REPO) --workflow pages.yml --commit $$head --json status,conclusion --jq '.[0] | .status + " " + (.conclusion // "")' 2>/dev/null || true); \
	  case "$$st" in "completed "*) break;; esac; sleep 5; \
	done; echo "pages deploy: $$st"; sleep 10; \
	if [[ "$$st" == "completed success" ]] && curl -sf "$(LIVE)" | grep -q 'Open the kit' && \
	   curl -sf "$(LIVE)kit-page/" | grep -q 'id="exp-form"' && \
	   $(NODE) tests/layout-check.mjs "$(LIVE)" --widths 375,1440 --out $(OUT)/live-home && \
	   $(NODE) tests/layout-check.mjs "$(LIVE)kit-page/" --widths 375,1440 --out $(OUT)/live-kit; then \
	  echo "SHIPPED: $(LIVE) passes the smoke test"; \
	else \
	  echo "SMOKE TEST FAILED: reverting to $$prev"; \
	  git revert --no-edit "$$prev..$$head"; $(PUSH); exit 1; \
	fi
