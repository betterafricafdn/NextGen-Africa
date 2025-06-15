// Single Constructors
type NameOfSomeone {
  first_name: ByteArray,
  last_name: ByteArray,
}

test test_nameofsomeone() {
  let someone_name = NameOfSomeone("David", "Mark")

  let NameOfSomeone { first_name, last_name } = someone_name

  trace @"first_name": first_name, someone_name.first_name
  trace @"last_name": last_name, someone_name.last_name
  Void
}

type Employee {
  name: NameOfSomeone,
  location: ByteArray,
  age: Int,
  working: Bool,
}

test test_employee() {
  let an_employee = Employee(NameOfSomeone("Sara", "Grace"), "Lagos", 28, True)

  trace @"employee age": an_employee.age

  Void
}

// Multi Constructors
type Creation {
  Human { first_name: ByteArray, last_name: ByteArray }
  Alien { identity: Int, planet: ByteArray }
}

test test_multi_contructors() {
  let a_human = Human("Bob", "Morley")
  let an_alien = Alien(3356888, "Mars")

  expect Human { first_name, .. } = a_human
  expect Alien { identity, planet } = an_alien

  trace @"human's first name": first_name
  trace @"alien": identity, planet
  Void
}

opaque type Genr {
  i: Int,
  j: ByteArray,
}

fn new_genr(i: Int, j: ByteArray) {
  Genr(i, j)
}

fn get_i(genr: Genr) {
  genr.i
}

test test_opaque() {
  let genr = new_genr(54, "Something")

  trace @"genr.i": get_i(genr)
  Void
}

fn maths(i, j, k, l, m) {
  let sub =
    fn(a, b) { a - b }

  i * j / k + sub(l, m)
}

test test_maths() {
  let maths_res = maths(300, 20, 10, 50, 40)

  trace @"maths_res": maths_res
  Void
}

pub const num = 35

test test_const() {
  trace @"num": num
  Void
}

test test_block() {
  //   let bool: Bool = {
  //     "Something"
  //     10 + 45
  //     False
  //   }

  trace @"block"
  Void
}
