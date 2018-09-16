
export function selectImage() {
  return new Promise((resolve, reject) =>
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: resolve,
      fail: reject
    })
  )
}
