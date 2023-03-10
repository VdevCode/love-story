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
          <h1>ch??? Dung</h1>
          <p>Em mu???n n??i v???i ch??? v??i ??i???u n??y.</p>
        `,
        btn: {
          text: "Ti???p theo"
        }
      })
    },
  
    async intro2() {
      return Views.messageWithButtons({
        content: `
          <h1>T???i sao em th??ch ch??? ?? ?</h1>
          <p>r???t ????n gi???n,v?? kh??ng ai ???????c nh?? ch??? trong m???t em.</p>
        `,
        btn: {
            text: "Ti???p theo"
        }
      })
    },
  
    async intro3() {
      return Views.messageWithButtons({
        content: `
          <h1>M???i l??c m???i n??i</h1>
          <p>Em lu??n<em> nh??? ?????n h??nh b??ng ch???</em> d?? em c?? ??i ch??i xa,h???c b??i,l??m vi???c ...</p>
          <p></p>
        `,
        btn: {
          text: 'ti???p theo'
        }
      })
    },
  
    async intro4() {
      return Views.messageWithButtons({
        content: `
          <h1>S??? th???t lu??n ??au l??ng</h1>
          <p>T??nh c???m n??y ch??? ?????n t??? 1 ph??a,em c?? th??? ch??? ?????i </p>
          <p>C??ng gi???ng nh?? ti??u ????? facebook c???a ch??? <em>"S???ng th???t t???t </em> ,r???i ch???m r??i g???p nhau"</p>
        `,
        btn: {
          text: "k???t th??c ..."
        }
      })
    },
  
    async main() {
      return Views.messageWithButtons({
        content: `
          <h1>L???i em mu???n n??i</h1>
          <p>N???u nh?? y??u ch??? l?? sai<em></em>,em v???n ch???n v?? ???? y??u r???i th?? sai ????ng c??ng kh??ng c??n quan tr???ng n???a.</p>
          <p>Thanh V??.</p>
        `,
        btn: [{
          text: 'Xo?? v?? b???t ?????u l???i',
          type: 'danger',
          key: Constants.DELETE
        }, {
          text: 'Ti???p theo',
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
          text: 'Quay l???i',
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