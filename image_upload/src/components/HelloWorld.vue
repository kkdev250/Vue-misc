<template>
  <div class="hello">
      <input 
        style="display: none;" 
        type="file" 
        @change="onFileSelected"
        ref="fileInput">
      <button @click="$refs.fileInput.click()">Pick File</button>
      <button @click="onUploadClick">Upload</button> <span>{{selectedName}}</span>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HelloWorld',
  data () {
    return {
      selectedFile: null
    }
  },
  methods: {
      onFileSelected(event) {
          //console.log(event);
          this.selectedFile = event.target.files[0];
      },
      onUploadClick() {
          const fd = new FormData();
          fd.append('image', this.selectedFile, this.selectedFile.name);
          axios.post('https://us-central1-fb-functions-37352.cloudfunctions.net/uploadFile', fd, {
              onUploadProgress: uploadEvent => {
                  console.log('Upload Progress: ' + Math.round(uploadEvent.loaded / uploadEvent.total * 100) + '%')
              }
          })
            .then(res => {
                console.log(res);
            })
      }
  },
  computed: {
      selectedName() {
          return this.selectedFile == null ? '' : '(' + this.selectedFile.name + ')';
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
