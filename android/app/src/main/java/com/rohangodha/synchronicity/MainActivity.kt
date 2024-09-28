package com.rohangodha.synchronicity

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavController
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rohangodha.synchronicity.ui.theme.SynchronicityTheme

class MainActivity : ComponentActivity() {
    var token: String? = null
    lateinit var navController: NavHostController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        token = getTokenFromPrefs()

        Log.i("MainActivity", "HELLO???");
        setContent {
            SynchronicityTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        App()
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        println("new intent")
        super.onNewIntent(intent)
        handleDeepLink(intent)?.let { token ->
            storeToken(token)
        }
    }

    @SuppressLint("ApplySharedPref")
    fun storeToken(token: String) {
        println("storing token $token")
        val prefs = this.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val edit = prefs.edit();
        edit.putString("token", token);
        edit.commit()
        this.token = token
    }

    @SuppressLint("ApplySharedPref")
    fun deleteToken() {
        val prefs = this.getSharedPreferences("prefs", Context.MODE_PRIVATE)
        val edit = prefs.edit()
        edit.remove("token")
        edit.commit()
        this.token = null
        println(getTokenFromPrefs())
        println(this.token)
    }

    fun getTokenFromPrefs(): String? {
        println("getting token!")
        val token = getSharedPreferences("prefs", Context.MODE_PRIVATE).getString("token", "")
        if (token == "") {
            return null
        } else {
            return token
        }
    }

    @Composable
    fun App() {
        navController = rememberNavController()

        NavHost(navController = navController, startDestination = Screen.LogIn.route) {
            composable(Screen.Home.route) {
                HomeScreen(navController = navController)
            }
            composable(Screen.LogIn.route) {
                LogInScreen(navController = navController)
            }

            composable(
                route = Screen.Playlist.route,
                arguments = listOf(navArgument("playlistId") { type = NavType.StringType })
            ) { backStackEntry ->
                val playlistId = backStackEntry.arguments?.getString("playlistId")
                if (playlistId != null) {
                    PlaylistScreen(playlistId = playlistId)
                }

            }
        }
    }

    @Composable
    fun PlaylistScreen(playlistId: String) {
        Text(text = "Playlist screen for playlist w/ ID $playlistId")
    }

    @Composable
    fun HomeScreen(navController: NavController) {
        if (token == null) {
            println("at home screen, token is $token, so we're going to login")
            return navController.navigate("login")
        }
        Column {
            Text(text = "Logged In! token: $token")
            Button(onClick = {
                deleteToken()
                navController.navigate("home")
            }) {
                Text(text = "Log out")
            }
        }
    }

    @Composable
    fun LogInScreen(navController: NavController) {
        if (token != null) {
            println("at login screen, token is $token, so we're going to home screen")
            return navController.navigate("home")
        }
        val context = LocalContext.current

        Button(onClick = { startAuth(context) }) {
            Text(text = "Login with Spotify")
        }
    }
}


fun startAuth(context: Context) {
    Log.i("MainActivity", "trying to go to url??");
    println("trying to start context??")
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("http://10.0.2.2:3000/auth/login"))
    context.startActivity(intent)

}

fun handleDeepLink(intent: Intent?): String? {
    Log.i("MainActivity", "trying to handle deeplink")
    intent?.data?.let { uri ->
        if (uri.scheme == "synchronicity" && uri.host == "auth") {
            val token = uri.getQueryParameter("token")
            println(token)
            return token
        }
    }
    return null
}

sealed class Screen(val route: String) {
    data object Home : Screen("home")
    data object LogIn : Screen("login")
    data object Playlist : Screen("playlist/{playlistId}")
}