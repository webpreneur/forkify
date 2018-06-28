import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
 * - Search object
 * - Current recipe obj
 * - Shopping list object
 * - Liked recipes
 */
const state = {};

/**
 * SEARCH CONTROLLER
 */

const controlSearch = async () => {
    // 1.) Get query from the view
    const query = searchView.getInput();

    if(query){
        // 2.) New search object and add it to state
        state.search = new Search(query);

        // 3.) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            // 4.) Search for recipes
            await state.search.getResults();
    
            // 5.) render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err){
            alert('something wrong with the search...');
            clearLoader();
        }
    }
}

elements.searchForm.addEventListener("submit", e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    console.log(btn);
    if(btn){
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
 * RECIPE CONTROLLER
 */

const controlRecipe = async () => {
    // get ID from URL
    const id = window.location.hash.replace('#', '');

    if(id){
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // highlight selected search item
        if(state.search) searchView.highlightSelected(id);

        // create new recipe object
        state.recipe = new Recipe(id);

        try{
            // get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            // render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );
        }
        catch (err){
            alert("Error processing recipe :(");
            console.log(err);
        }
        
    }

}

['hashchange', 'load'].forEach( event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */
const controlList = () => {
    // create a new list if there is none yet
    if(!state.list) state.list = new List();

    // add each ingredient to the list
    state.recipe.ingredients.forEach( el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

// Handle delete and update list item elements

elements.shopping.addEventListener('click', e => {
    console.log('click...');
    const id = e.target.closest('.shopping__item').dataset.itemid;
    console.log(id);
    // handle the delete button
    console.log(e.target);
    if (e.target.matches('.shopping__delete, .shopping__delete *')){
        console.log('delete from state and ui block reacched');
        // delete from state
        state.list.deleteItem(id);

        // delete from UI
        listView.deleteItem(id);
    
    // handle count update
    } else if (e.target.matches('shopping__count-value')){
        const val = parseFloat(e.target.value,10);
        state.list.updateCount(id, val);
    }
})

/**
 * LIKE CONTROLLER
 */
  
 const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // user has NOT yet liked current recipe
    if(!state.likes.isLiked(currentID)) {
        // add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        );
        // toggle the like button
        likesView.toggleLikeBtn(true);
        
        // add like to the UI list
        likesView.renderLike(newLike);
    
        // user HAS liked current recipe
    } else {
        // remove like frome the state
        state.likes.deleteLike(currentID);
        
        // toggle the like button
        likesView.toggleLikeBtn(false);
        
        // remove like to the UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
 };


// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    // restore likes
    state.likes.readStorage();

    // toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());  

    // render the existing likes
    state.likes.likes.forEach( like => likesView.renderLike(like));

});

// Handling recipe button clicks
elements.recipe.addEventListener("click", e => {
    console.log('recipe click evt listener triggered');
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        console.log('decrease button is clicked');
        if(state.recipe.servings > 1){
            // decrease button is clicked
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        console.log('increase button is clicked');
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        console.log('add ingredients to shopping list is clicked');
        // add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, recipe__love *')){
        console.log('like controller btn is clicked');
        // like controller
        controlLike();
    }
});
