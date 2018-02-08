import { Person } from 'blockstack'

Template.blockstackAvatar.replaces('avatar')

Template.avatar.helpers({
	imageUrl() {
    // url may exist in template data
		let { url } = Template.instance().data;
    if (url) return `background-image:url(${ url });`

    // url can be generated for room icons
    if (this.roomIcon) {
      url = getAvatarUrlFromUsername(`@${ this.roomIcon }`)
      return `background-image:url(${ url });`
    }

    // get url from user if we have one
    if (this.username == null) return

		// NB: This doesn't work, becuase services aren't available
		// TODO: Make avatar field from profile available in all templates

    // look for url from user services
    const user = Meteor.users.findOne({ username: this.username })
    console.log(user)
    if (Array.isArray(user.services) && user.services.blockstack) {
      console.log(person)
      person = new Person(user.services.blockstack.profile)
      if (person.avatarUrl()) url = person.avatarUrl()
    } else {
      url = getAvatarUrlFromUsername(this.username)
    }
    return `background-image:url(${ url });`
	}
})
