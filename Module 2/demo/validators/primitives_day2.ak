test test_int() {
  let i = 50
  let j = 170

  trace @"result of i + j": i + j
  Void
}

test test_int2() {
  let i = 3
  let j = 2

  trace @"result of i / j": i / j
  Void
}

test test_int3() {
  let i = 3_000_000
  let j = 2

  trace @"result of i / j": i / j
  Void
}

test test_bytes() {
  let i = "abcd"
  let j = #"abcd"

  trace @"result of i": i
  trace @"result of i": j
  Void
}

pub fn my_func() {
  // todo @"not working on it now"
  Void
}

test test_boolean() {
  let i = False
  let j = False
  let k = True

  trace @"boolean test"
  ( !i || !j ) && k
}

test test_boolean2() {
  let i = True
  let j = True

  trace @"boolean test 2"
  and {
    i,
    j,
  }
}

test test_boolean3() {
  let i = False
  let j = False
  let k = True

  trace @"boolean test 3"
  or {
    i,
    j,
    k,
  }
}
