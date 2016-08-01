TEST_CMD := ./node_modules/.bin/ava
BUILD_CMD := ./node_modules/.bin/babel ./src -d ./lib --ignore '__tests__' --presets es2015,stage-0
BUILD_ES6_CMD := ./node_modules/.bin/babel ./src -d ./es6 --ignore '__tests__' --presets stage-0

build-es5:
	@$(BUILD_CMD)

build-es6:
	@$(BUILD_ES6_CMD)

ci:
	@$(TEST_CMD) -- --watch

clean:
	@rm -rf ./lib
	@rm -rf ./es6

build: clean build-es5 build-es6

dev:
	@$(BUILD_CMD) --watch & $(BUILD_ES6_CMD) --watch

lint:
	@node_modules/.bin/eslint src

test:
	@$(TEST_CMD)

major:
	npm version major

minor:
	npm version minor

patch:
	npm version patch

changelog.template.ejs:
	@echo "## x.x.x\n\n<% commits.forEach(function(commit) { -%>\n* <%= commit.title %>\n<% }) -%>" > changelog.template.ejs

changelog: changelog.template.ejs
	@touch CHANGELOG.md
	@git-release-notes $$(git describe --abbrev=0)..HEAD $< | cat - CHANGELOG.md >> CHANGELOG.md.new
	@mv CHANGELOG.md{.new,}
	@rm changelog.template.ejs
	@echo "Added changes since $$(git describe --abbrev=0) to CHANGELOG.md"

.PHONY: clean dev lint examples test major minor patch
