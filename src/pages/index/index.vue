<template>
  <div class="container">
    <div class="image-container">

      <div class="reference-container" @click="openReferenceList">
        <img class="reference-img" v-if="reference" :src="reference" mode="widthFix"/>
        <div class="reference-text" v-if="!reference">点击选择<br/>被 PK 者<br/>的表情</div>
      </div>

      <div class="face-container" @click="chooseFace">
        <img class="face-img" v-if="face" :src="face" mode="widthFix"/>
        <div class="face-text" v-if="!face">点击请选择<br/>PK 者<br/>的表情</div>
      </div>
    </div>

    <div class="score-container">
      <div> PK 得分： {{ score ? score : '00' }} </div>
    </div>

    <div v-if="showReferenceList" class="modal-container">
      <div class="modal-title">选择要 PK 的表情</div>
      <div class="modal-body">
        <div v-for="(url, index) in referenceList" :key="index"  @click="choosePresetReference(url)" class="modal-item">
          <img mode="widthFix" :src="url"/>
        </div>
      </div>
      <div>
        <button @click="chooseReference">从相册选择</button>
        <button @click="closeReferenceList">取消</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
  .container {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;

    text-align: center;
  }

  .image-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 300px;
  }

  .reference-container {
    height: 300px;
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    overflow: hidden;
    border: 1px solid grey;
  }

  .face-container {
    height: 300px;
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    overflow: hidden;
    border: 1px solid grey;
  }

  .reference-img {
    width: 100%;
    height: auto;
  }

  .face-img {
    width: 100%;
    height: auto;
  }

  .modal-container {
    position: fixed;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-content: center;
    background: #fff;
  }

  .modal-body {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
  }

  .modal-item {
    width: 100px;
    height: 100px;
    border: 1px solid grey;
    overflow: hidden;
  }

  .modal-item img {
    width: 100px;
    height: auto;
  }

</style>

<script>
  import { attributes, hasFace, compare } from './face-analize.js'

  export default {
    data () {
      return {
        reference: null,
        face: null,
        score: null,
        referenceList: [
          '/static/reference/1.jpg',
          '/static/reference/2.png',
          '/static/reference/4.png',
          '/static/reference/5.jpg',
          '/static/reference/6.png',
          '/static/reference/7.png'
        ],
        showReferenceList: false
      }
    },

    methods: {
      getFaceInfo (path) {
        return new Promise(resolve => wx.uploadFile({
          url: 'https://api-cn.faceplusplus.com/facepp/v3/detect',
          filePath: path,
          name: 'image_file',
          formData: {
            api_key: 'Yuidwhp8NdJluvBWp4_iS1fEA7kbDFq-',
            api_secret: 'pN9aSlIo3-1q6xklRXRX8WGvAz3yuFHT',
            return_attributes: attributes.join(','),
            return_landmark: 1
          },
          success: res => resolve(JSON.parse(res.data)),
          fail: () => resolve(null)
        }))
      },

      chooseImage () {
        return new Promise(resolve => wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera'],
          success: res => {
            const [tempFilePath] = res.tempFilePaths
            resolve(tempFilePath)
          },
          fail: () => resolve(null)
        }))
      },

      async compare () {
        if (!this.reference || !this.face) return

        wx.showLoading({ title: '正在计算' })
        const reference = await this.getFaceInfo(this.reference)
        const face = await this.getFaceInfo(this.face)
        wx.hideLoading()

        if (!reference || !hasFace(reference) || !face || !hasFace(face)) {
          console.log(reference)
          console.log(face)
          wx.showModal({ title: '提示', content: '被 pk 者图片错误' })
        }

        this.score = compare(reference, face)
      },

      openReferenceList () {
        this.showReferenceList = true
      },

      closeReferenceList () {
        this.showReferenceList = false
      },

      choosePresetReference (url) {
        this.reference = url
        this.closeReferenceList()
      },

      async chooseReference () {
        const path = await this.chooseImage()
        if (path === null) return
        this.reference = path
        this.compare()
        this.closeReferenceList()
      },

      async chooseFace () {
        const path = await this.chooseImage()
        if (path === null) return
        this.face = path
        this.compare()
      }
    }
  }
</script>

