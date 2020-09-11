#!/bin/bash
curl \
  --header "Authorization: Token 89f704db-718c-4b39-b551-4c8594fc31ff" \
  --header "Content-Type: application/json" \
  --data "{
    \"value\":\"42 %\",
    \"sha\":\"${TRAVIS_COMMIT}\"
  }" \
  https://seriesci.com/api/sambacha/DiscourseAragonConnectNode/:series/one
