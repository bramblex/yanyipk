/* eslint-disable */

// 默认比较的特征
const features = [
  'mouth',
  'left_eye',
  'left_eyebrow',
  'right_eye',
  'right_eyebrow'
]
const attributes = ['gender', 'age', 'emotion', 'smiling']

// 默认权重
const default_config = {
  match_threshold: 8,
  emotion_threshold: 15, // 情绪阈值
  emotion_coefficients: [1, 0.8], // 情绪系数 [匹配上, 未匹配上]

  mouth_weight: 0.5, // 嘴巴的权重
  left_eye_weight: 0.125, // 眼睛的权重, 会平分给左眼和右眼
  right_eye_weight: 0.125,
  left_eyebrow_weight: 0.125, // 眉毛的权重, 一样会平分给左眼和右眼
  right_eyebrow_weight: 0.125
}

// 工具函数
const keys = map => Object.getOwnPropertyNames(map).sort()
const values = map => keys(map).map(key => map[key])
const kvpairs = map => keys(map).map(key => [key, map[key]])

const mapkv = (map, func) =>
  kvpairs(map).reduce((p, [k, v]) => {
    const kv = func(k, v)
    p[kv[0]] = kv[1]
    return p
  }, {})

const mapv = (map, func) => mapkv(map, (k, v) => [k, func(v)])

const zipWith = (arr1, arr2, func) => arr1.map((l, i) => func(l, arr2[i]))
// const zip = (arr1, arr2) => zipWith(arr1, arr2, (l, r) => [l, r])
// const copy = obj => JSON.parse(JSON.stringify(obj))

const max = (ns, less = (a, b) => a < b) =>
  ns.reduce((p, c) => (less(p, c) ? c : p))
// const min = (ns, less = (a, b) => a < b) => max(ns, (a, b) => !less(a, b))

// 向量运算
const zero = { x: 0, y: 0 }
// const mkp = (x, y) => ({ x, y })
const addp = (p1, p2) => ({ x: p1.x + p2.x, y: p1.y + p2.y })
const subp = (p1, p2) => ({ x: p1.x - p2.x, y: p1.y - p2.y })
const mulp = (p, n) => ({ x: p.x * n, y: p.y * n })
const sump = ps => ps.reduce(addp, zero)
const avgp = ps => mulp(sump(ps), 1 / ps.length)

// 向量取模
const moldp = p => Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2))

// 数值运算
const sum = ns => ns.reduce((a, b) => a + b, 0)
const avg = ns => sum(ns) / ns.length

// 图片中是否存在人脸
const hasFace = raw => raw && raw.faces && raw.faces.length > 0

// 获取主要人脸
const getMainFace = raw =>
  max(raw.faces, (p, c) => p.face_rectangle.width < c.face_rectangle.width)

// 图片中人脸所占的比例
const faceProporition = (face_image, raw_face) =>
  raw_face.face_rectangle.width *
  raw_face.face_rectangle.height /
  (face_image.width * face_image.height)

// 分析并且将数据标准化，用于之后的比较
const standradize = raw => {
  if (hasFace(raw)) {
    // 获取最大的脸
    const raw_face = getMainFace(raw)

    // 把脸部的数据标准化至 100 * 100 内
    const { width } = raw_face.face_rectangle
    const scale = 100 / width

    // 初始化
    const face = {}
    for (const feature of features) face[feature] = {}

    for (const [point_name, raw_point] of kvpairs(raw_face.landmark)) {
      // 将点标准化至 100 * 100 内
      const point = mulp(raw_point, scale)

      // 获取需要的点，并且分组
      for (const feature of features) {
        if (RegExp(`^${feature}_`).test(point_name)) {
          face[feature][point_name] = point
          continue
        }
      }
    }

    // 将五官中心移到原点方便之后的比较
    for (const feature of features) {
      const origin = avgp(values(face[feature]))
      face[feature] = mapv(face[feature], point => subp(point, origin))
    }

    // 获取并添加最可能的情绪
    face.emotion = kvpairs(raw_face.attributes.emotion).reduce(
      (prev, curr) => (prev[1] > curr[1] ? prev : curr)
    )

    // 返回标准化的数据
    return face
  } else {
    return null
  }
}

// 计算单个特征
const compareFeature = (left, right) =>
  avg(zipWith(values(left), values(right), (l, r) => moldp(subp(l, r))))

const compareEmotion = (left, right, threshold) =>
  left[0] === right[0] && Math.abs(left[1] - right[1]) <= threshold

// 比较并且计算打分
const compare = (_left, _right, _config = default_config) => {
  const left = standradize(_left)
  const right = standradize(_right)

  const config = Object.assign({}, default_config, _config || {})

  // 情绪系数
  const emotion_coefficient = compareEmotion(
    left.emotion,
    right.emotion,
    config.emotion_threshold
  )
    ? config.emotion_coefficients[0]
    : config.emotion_coefficients[1]

  // 比较结果 * 权重，得到加权的平均差值
  const avg_dev = sum(
    features.map(
      feature =>
        compareFeature(left[feature], right[feature]) *
        config[`${feature}_weight`]
    )
  )

  // 将结果分布在 0~100 分内。
  const x =
    (avg_dev > config.match_threshold ? config.match_threshold : avg_dev) /
    config.match_threshold

  const result =
    emotion_coefficient * Math.round(50 * (Math.cos(x * Math.PI) + 1))

  return Math.round(result)
}

export {
  hasFace,
  getMainFace,
  faceProporition,
  standradize,
  compare,
  features,
  attributes
}
