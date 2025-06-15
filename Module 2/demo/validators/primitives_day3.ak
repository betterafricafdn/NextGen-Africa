use aiken/primitive/bytearray.{compare}

test test_tuple() {
  let tup: (Int, Int) = (3, 4)

  trace @"a tuple": tup
  Void
}

test test_tuple_inferred() {
  let tup = (3, 4)

  trace @"a tuple": tup
  Void
}

test test_tuple_diffs() {
  let tup = (3, 4, "Tuple")

  trace @"a tuple": tup
  Void
}

test test_tuple_destructure() {
  let tup = (3, 4, "Tuple")

  trace @"first tuple element": tup.1st
  trace @"second tuple element": tup.2nd
  trace @"third tuple element": tup.3rd
  Void
}

test test_tuple_destructure2() {
  let tup = (3, 4, "Tuple")
  let (fir, sec, thi) = tup

  trace @"first tuple element": fir
  trace @"second tuple element": sec
  trace @"third tuple element": thi
  Void
}

test test_list() {
  let my_lis: List<Int> = [3, 4, 1000]

  trace @"a list": my_lis
  Void
}

test test_list_inferred() {
  let my_lis = [3, 4, 1000]

  trace @"a list": my_lis
  Void
}

test test_list_destructure() {
  let my_lis: List<Int> = [3, 4, 1000]

  expect [_, second, _] = my_lis

  trace @"a list": second
  Void
}

pub type Option<a> {
  Some(a)
  None
}

test test_option() {
  let example = Some(45)

  // let example = None
  trace @"Some(45)": example

  when example is {
    Some(the_int) -> {
      trace @"the_int": the_int
      True
    }
    None -> False
  }
}

// pub type Ordering {
//   Less
//   Greater
//   Equal
// }

test test_ordering() {
  let var1 = "ab"
  let var2 = "cd"

  let comp = compare(var1, var2)

  if comp == Less {
    trace @"var1 is less than var2"
    True
  } else if comp == Greater {
    trace @"var1 is greater than var2"
    True
  } else {
    False
  }
}

test test_data_upcast() {
  let var1: Data = "ab"
  let var2: Data = 122
  let var3: Data = True

  trace @"data:": var1, var2, var3
  Void
}

test test_downcast() {
  let var1: Data = 1
  expect var2: Int = var1

  trace @"data:": var1, var2
  Void
}
