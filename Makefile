.PHONY: test
test:
	deno test --coverage=./cov --unstable --allow-all

.PHONY: lint
lint:
	deno fmt --check *.ts
	deno lint --unstable

.PHONY: outdated
# https://github.com/hayd/deno-udd
# deno install -A -f -n udd https://deno.land/x/udd@0.4.0/main.ts
outdated:
	udd test_deps.ts

.PHONY: test-install
# https://github.com/kuuote/deno-cache-injector
# deno install -n deno-cache-injector --allow-env --allow-read --allow-write https://deno.land/x/cache_injector@1.0.0/injector.ts
test-install:
	deno-cache-injector ./ https://deno.land/x/deno_interceptor@9.9.9

