Vue.createApp({
    data() {
        return {
            scrollIteration: 0,
            MIN_GAMES_DISPLAYED: 12,
            scrollToTopBtnisVisible: false,
            isFavOnly: false,
            search: '',
            hasReachBottom: false,
            isMounted: false,

            games: [],
            genreFilters: [],
            reviewFilter: null,
            releaseDateFilter: {
                value: null,
                label: null
            },
            genres: [],
            RANK_REVIEWS_FILTER: ['Overwhelmingly Positives only', 'Very Positives and above', 'Positives and above', 'Mostly Positives and above', 'Mixed and above'],
            RELEASE_DATES_FILTER: ['6 months', '1 year', '2 years', '3 years', '5 years', '10 years'],
            orders: ['Name', 'Release date', 'Review']
        }
    },

    mounted() {
        window.addEventListener('scroll', this.onScroll)

        const reqAppDetails = axios.get('appdetails.json')
        const reqAppReviews = axios.get('appreviews.json')

        axios.all([reqAppDetails, reqAppReviews])
            .then(axios.spread((...res) => {
                let localFavs = JSON.parse(localStorage.getItem('favorites'))
                if (localFavs === null) {
                    localFavs = []
                }
                res[0].data.forEach(raw => {
                    let game = {
                        isVisible: true,
                        isFavorite: (localFavs.includes(raw.id)) ? true : false,

                        id: raw.id,
                        name: raw.name,
                        backgroundImg: raw.backgroundImg,
                        description: raw.description
                            .replaceAll('&amp;', '&')
                            .replaceAll('&lt;', '<')
                            .replaceAll('&gt;', '>')
                            .replaceAll('&quot;', '"')
                            .replaceAll('&#039;', "'"),
                        developers: raw.developers,
                        publishers: raw.publishers,
                        genres: raw.genres,
                        categories: raw.categories,
                        release: raw.release,
                        website: raw.website
                    }

                    res[1].data.forEach(e => {
                        if (game.id == e.id) {
                            game.review = {
                                score: e.score,
                                description: e.description,
                                totalPositive: e.totalPositive,
                                totalReviews: e.totalReviews
                            }
                            this.games.push(game)
                            return
                        }
                    })
                })

                let countGenres = {}
                this.games.map(g => g.genres).flat().forEach((g) => {
                    countGenres[g] = (countGenres[g] || 0) + 1
                })

                for (const prop in countGenres) {
                    this.genres.push({
                        name: prop,
                        total: countGenres[prop]
                    })
                }
                this.genres.sort((a, b) => { return b.total - a.total })

                this.isMounted = true
            })).catch(err => {
                console.error(err)
            })

        window.onscroll = () => {
            if (document.documentElement.scrollTop + window.innerHeight - document.documentElement.offsetHeight + 400 > 0)  {
                this.scrollIteration += 1
                this.hasReachBottom = true
            }
        }
    },
    methods: {
        openSteamLink: function (id) { window.open('https://store.steampowered.com/app/' + id, '_blank') },

        filter: function (filteredGenre, reviewFilter, releaseFilter) {
            this.scrollIteration = 0
            this.games.forEach((game) => {
                game.isVisible = false

                if ((game.isFavorite && this.isFavOnly) || !this.isFavOnly) {
                    if (this.releaseDateFilter.value == null ||
                        Math.round((Date.now() - new Date(game.release)) / 1000 / 60 / 60 / 24 / 30) <= this.releaseDateFilter.value) {

                        game.genres.forEach((g) => {
                            if (this.genreFilters.every(g => game.genres.includes(g))) {

                                if (true) {
                                    if (reviewFilter == null) {
                                        game.isVisible = true
                                        return

                                    } else if (reviewFilter == this.RANK_REVIEWS_FILTER[0] && game.review.score > 8) { //Overwhelmingly Positive only
                                        game.isVisible = true
                                        return

                                    } else if (reviewFilter == this.RANK_REVIEWS_FILTER[1] && game.review.score > 7) { //Very Positives and above
                                        game.isVisible = true
                                        return

                                    } else if (reviewFilter == this.RANK_REVIEWS_FILTER[2] && game.review.score > 6) { //Positives and above
                                        game.isVisible = true
                                        return

                                    } else if (reviewFilter == this.RANK_REVIEWS_FILTER[3] && game.review.score > 5) { //Mostly Positives and above
                                        game.isVisible = true
                                        return

                                    } else if (reviewFilter == this.RANK_REVIEWS_FILTER[4] && game.review.score > 4) { //'Mixed and above
                                        game.isVisible = true
                                        return
                                    }
                                }
                            }
                        })
                    }
                }
            })
        },

        filterGenre: function (filteredGenre) {
            if (!this.genreFilters.includes(filteredGenre)) {
                this.genreFilters.push(filteredGenre)
            }
            this.filter(this.genreFilters, this.reviewFilter, this.releaseDateFilter)
        },

        clearGenreFilter: function (genreToRemove) {
            this.genreFilters = this.genreFilters.filter(g => g !== genreToRemove)
            this.filter(this.genreFilters, this.reviewFilter, this.releaseDateFilter)
        },

        filterReviews: function (review) {
            this.reviewFilter = review
            this.filter(this.genreFilters, this.reviewFilter, this.releaseDateFilter)
        },

        clearReviewFilter: function () {
            this.reviewFilter = null
            this.filter(this.genreFilters, this.reviewFilter, this.releaseDateFilter)
        },

        filterReleaseDate: function (releaseDate) {

            if (releaseDate === this.RELEASE_DATES_FILTER[0]) {
                this.releaseDateFilter = { value: 6, label: this.RELEASE_DATES_FILTER[0] }
            } else if (releaseDate === this.RELEASE_DATES_FILTER[1]) {
                this.releaseDateFilter = { value: 12, label: this.RELEASE_DATES_FILTER[1] }
            } else if (releaseDate === this.RELEASE_DATES_FILTER[2]) {
                this.releaseDateFilter = { value: 2 * 12, label: this.RELEASE_DATES_FILTER[2] }
            } else if (releaseDate === this.RELEASE_DATES_FILTER[3]) {
                this.releaseDateFilter = { value: 3 * 12, label: this.RELEASE_DATES_FILTER[3] }
            } else if (releaseDate === this.RELEASE_DATES_FILTER[4]) {
                this.releaseDateFilter = { value: 5 * 12, label: this.RELEASE_DATES_FILTER[4] }
            } else if (releaseDate === this.RELEASE_DATES_FILTER[5]) {
                this.releaseDateFilter = { value: 10 * 12, label: this.RELEASE_DATES_FILTER[5] }
            }

            this.filter(this.genreFilters, this.reviewFilter, this.releaseDateFilter)
        },

        clearReleaseDateFilter: function () {
            this.releaseDateFilter = { id: null, value: null }
            this.filter(this.genreFilters, this.reviewFilter, this.releaseDateFilter)
        },

        sortGames: function (order) {
            if (order === this.orders[0]) {//order by name
                this.games.sort((a, b) => a.name.localeCompare(b.name))

            } else if (order === this.orders[1]) { //order by release date
                this.games.sort((a, b) => new Date(b.release) - new Date(a.release))

            } else if (order === this.orders[2]) { //order by review score 
                this.games.sort((a, b) => {
                    if (a.review.score === a.review.score) {
                        return (b.review.totalPositive / b.review.totalReviews) - (a.review.totalPositive / a.review.totalReviews)
                    }
                    return a.review.score - b.review.score
                })
                this.games.sort((a, b) => b.review.score - a.review.score)
            }
        },

        onScroll: function (e) {
            this.scrollToTopBtnisVisible = (e.target.documentElement.scrollTop > 400) ? true : false
        },

        scrollToTop: function () {
            window.scrollTo(0, 0)
        },

        addToFavorites: function (id) {
            let localFavs = JSON.parse(localStorage.getItem('favorites'))

            localFavs = (localFavs === null) ? [] : JSON.parse(localStorage.getItem('favorites'))

            if (!localFavs.includes(id)) {
                localFavs.push(id)
                localStorage.setItem('favorites', JSON.stringify(localFavs))
            }

            this.games.find(g => g.id === id).isFavorite = true
        },

        removeFromFavorites: function (id) {
            let localFavs = JSON.parse(localStorage.getItem('favorites'))
            if (localFavs.includes(id)) {
                localFavs = localFavs.filter(f => f !== id)
                localStorage.setItem('favorites', JSON.stringify(localFavs))
            }

            this.games.find(g => g.id === id).isFavorite = false
        },

        filterFavorites: function () {
            this.isFavOnly = (this.isFavOnly) ? false : true
            this.filter(this.genreFilters, this.reviewFilter, this.releaseDateFilter)

        }
    }, computed: {
        displayedGames() {
            if (this.search) {
                return this.games.filter(g => g.isVisible === true && g.name.toUpperCase().includes(this.search.toUpperCase())).slice(0, this.MIN_GAMES_DISPLAYED)
            }
            if (this.hasReachBottom) {
                this.hasReachBottom = false
                return this.games.filter(g => g.isVisible === true).slice(0, this.MIN_GAMES_DISPLAYED + 9 * this.scrollIteration)
            }

            return this.games.filter(g => g.isVisible === true).slice(0, this.MIN_GAMES_DISPLAYED)
        }
    }
}).mount('#app')