use aiken/cbor

test debugging() {
  (True && True)?
}

test debugging_2() {
  let i = 30
  let j = 24

  (i != j)?
}

test cbor_bytearray() {
  let a_bytearray = "House"

  trace @"a_bytearray": a_bytearray

  Void
}

type MyDatum {
  foo: Int,
  bar: ByteArray,
}

test cbor() {
  let datum = MyDatum(42, "Hello World!")

  trace @"cbor of datum": cbor.diagnostic(datum)

  Void
}
