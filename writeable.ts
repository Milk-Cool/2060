type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export default Writeable;