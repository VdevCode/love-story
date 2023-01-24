// Used in flow decision points
const Constants = {
    DELETE: 'delete a progress',
    FORWARD: 'move forward a step in the flow',
    BACK: 'go back one step in the flow',
    LOCALSTORAGE_ERROR: "Couldn't access localStorage. Please check your browser settings and try again."
  }
  
  // Helpers
  const Utils = {
    sleep: async (durationMilliseconds) => {
      return new Promise(resolve => {
        return setTimeout(resolve, durationMilliseconds)
      })
    },
  
    branchOff: (srcFlow, subFlows) => async () => {
      const { key } = await srcFlow()
      return subFlows[key]()
    }
  }
  
  // Side-effects
  const Actions = {
    async loadUserProgress() {
      await Utils.sleep(2000)
      try {
        return window.localStorage.getItem('userProgress')
      } catch (e) {
        return Promise.resolve(Constants.LOCALSTORAGE_ERROR)
      }
    },
  
    async saveUserProgress() {
      await Utils.sleep(2000)
      try {
        return window.localStorage.setItem(
          'userProgress',
          JSON.stringify({some: 'data'})
        )
      } catch (e) {
        return Promise.resolve(Constants.LOCALSTORAGE_ERROR)
      }
    },
  
    async deleteUserProgress() {
      await Utils.sleep(2000)
      try {
        window.localStorage.removeItem('userProgress')
      } catch (e) {
        return Promise.resolve(Constants.LOCALSTORAGE_ERROR)
      }
      return Promise.resolve()
    }
  }
  
  // All the ways the app can be in,
  // named and organized freely, using Promises
  const Flows = {
    master: async () => {
      const [ , progress ] = await Promise.all([
        Views.loading(),
        Actions.loadUserProgress()
      ])
      if (!progress) {
        return Flows.firstTime()
      }
      if (progress === Constants.LOCALSTORAGE_ERROR) {
        return Flows.abort(progress)
      }
      return Flows.continuation()
    },
  
    firstTime: async () => {
      await Views.intro1()
      await Views.intro2()
      await Views.intro3()
      await Views.intro4()
  
      await Promise.all([
        Views.saving(),
        Actions.saveUserProgress()
      ])
   
      return Flows.continuation()
    },
  
    continuation:  Utils.branchOff(
      () => Views.main(),
      {
        async [Constants.FORWARD]() {
          await Views.afterMain()
          return Flows.continuation()
        },
  
        async [Constants.DELETE]() {
          await Promise.all([
            Views.deleting(),
            Actions.deleteUserProgress()
          ])
          return Flows.master()
        }
      }),
    
    abort: async (progress) => {
      await Views.error(progress)
      window.location.href = window.location.href
    }
  }
  
  // Things to render on the screen
  const Views = {
    init(el) {
      this.el = el
    },
  
    // One of the 2 "componentized" Views
    async messageWithButtons({ content, btn }) {
      const getBtn = (maybeMultipleBtns) => {
        if (Array.isArray(maybeMultipleBtns)) {
          return maybeMultipleBtns
        }
        return [maybeMultipleBtns]
      }
  
      const template = () => {
        return `
          <form id="complete-step-form" class="view message-view">
            ${content}
            <footer>
              ${getBtn(btn).map(eachBtn => `
                <button
                  autofocus
                  class="btn ${eachBtn.type || ''}"
                  data-key="${eachBtn.key || Constants.FORWARD}"
                >
                  ${eachBtn.text}
                </button>
              `).join('')}
            </footer>
          </form>
        `
      }
  
      const transitionDuration = 500
      
      const cssVariables = () => `;
        --transition-duration: ${transitionDuration};
      `
  
      const listenToFormSubmit = (onSubmit) => {
        const form = this.el.querySelector('#complete-step-form')
        form.addEventListener('submit', e => {
          e.preventDefault()
          form.classList.add('exiting')
          setTimeout(() => {
            onSubmit({
              key: e.submitter.dataset.key
            })
          }, transitionDuration)
        })
      }
  
      this.el.innerHTML = template()
      this.el.style.cssText += cssVariables()
      return new Promise(listenToFormSubmit)
    },
  
    // Another "component" View
    async statusFeedback({ text, type }) {
      const template = () => {
        const typeClassName = type || ''
        return `
          <div class="view status-feedback-view">
            <span class="animation-object ${type}"></span>
            <span class="status-text ${type}">${text}</span>
          </div>
        `
      }
  
      const animationDuration = 1500
  
      const cssVariables = () => `;
        --animation-duration: ${animationDuration}ms;
        --type: ${type};
      `
  
      const listenToAnimationEnd = (onEnd) => {
        setTimeout(onEnd, animationDuration)
      }   
  
      this.el.innerHTML = template()
      this.el.style.cssText += cssVariables()
      await new Promise(listenToAnimationEnd)
    },
  
    // A higher-order View, that uses a component
    async loading() {
      return Views.statusFeedback({
        text: 'loading',
        type: 'loading'
      })
    },
  
    async saving() {
      return Views.statusFeedback({
        text: 'saving',
        type: 'saving'
      })
    },
  
    async deleting() {
      return Views.statusFeedback({
        text: 'deleting',
        type: 'deleting'
      })
    },
  
    // Another higher-order View, that uses a different component
    async intro1() {
      return Views.messageWithButtons({
        content: `
          <h1>chị Dung</h1>
          <p>Em muốn nói với chị vài điều này.</p>
        `,
        btn: {
          text: "Tiếp theo"
        }
      })
    },
  
    async intro2() {
      return Views.messageWithButtons({
        content: `
          <h1>Tại sao em thích chị ư ?</h1>
          <p>rất đơn giản,vì không ai được như chị trong mắt em.</p>
        `,
        btn: {
            text: "Tiếp theo"
        }
      })
    },
  
    async intro3() {
      return Views.messageWithButtons({
        content: `
          <h1>Mọi lúc mọi nơi</h1>
          <p>Em luôn<em> nhớ đến hình bóng chị</em> dù em có đi chơi xa,học bài,làm việc ...</p>
          <p></p>
        `,
        btn: {
          text: 'tiếp theo'
        }
      })
    },
  
    async intro4() {
      return Views.messageWithButtons({
        content: `
          <h1>Sự thật luôn đau lòng</h1>
          <p>Tình cảm này chỉ đến từ 1 phía,em có thể chờ đợi </p>
          <p>Cũng giống như tiêu đề facebook của chị <em>"Sống thật tốt </em> ,rồi chậm rãi gặp nhau"</p>
        `,
        btn: {
          text: "kết thúc ..."
        }
      })
    },
  
    async main() {
      return Views.messageWithButtons({
        content: `
          <h1>Lời em muốn nói</h1>
          <p>Nếu như yêu chị là sai<em></em>,em vẫn chọn vì đã yêu rồi thì sai đúng cũng không còn quan trọng nữa.</p>
          <p>Thanh Vũ.</p>
        `,
        btn: [{
          text: 'Xoá và bắt đầu lại',
          type: 'danger',
          key: Constants.DELETE
        }, {
          text: 'Tiếp theo',
          type: 'neutral',
          key: Constants.FORWARD
        }]
      })
    },
  
    async afterMain() {
      return Views.messageWithButtons({
        content: `
          <img src="https://scontent.fsgn2-1.fna.fbcdn.net/v/t39.30808-6/318338725_553042616700826_4952307053544199788_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=NrKvUbla3SMAX9GOVSj&_nc_ht=scontent.fsgn2-1.fna&oh=00_AfBp8mTrsoNNK-e1hm86Sz48JtG1yW59Hi4XjAHr9TPX-g&oe=63D5228E" alt="a photo" />
        `,
        btn: {
          text: 'Quay lại',
          type: 'different'
        }
      })
    },
  
    async error(message) {
      return Views.messageWithButtons({
        content: `
          <h1>Error</h1>
          <p>${message}</p>
        `,
        btn: {
          text: 'Refresh page',
          type: 'absurd'
        }
      })
    },
  }
  
  // Views should recognize the container
  Views.init(document.getElementById('app'))
  
  // Init one of the flows
  Flows.master()